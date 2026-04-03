const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { optionalAuth } = require('../middleware/auth');
const {
  validateYouTubeUrl,
  fetchMetadata,
  convertToMp3,
  cleanupTempFile,
  searchYouTube,
  getStreamUrl,
} = require('../services/converter');
const supabase = require('../lib/supabase');

/**
 * POST /api/convert/metadata
 * Fetch metadata for a YouTube URL before conversion starts.
 * Used to show song info in the ad modal before conversion begins.
 */
router.post('/metadata', optionalAuth, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  const validation = validateYouTubeUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  try {
    const metadata = await fetchMetadata(url);
    res.json({ metadata });
  } catch (err) {
    console.error('[Metadata] Error:', err.message);
    if (err.message.includes('too long')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to fetch video metadata. The video may be private or unavailable.' });
  }
});

/**
 * POST /api/convert/start
 * Converts a YouTube URL to MP3, uploads to Supabase Storage,
 * and saves song metadata to the DB (for auth users) or returns
 * the public URL (for guests).
 *
 * Uses Server-Sent Events (SSE) to stream progress to the client.
 */
router.post('/start', optionalAuth, async (req, res) => {
  const { url, metadata: clientMetadata } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  const validation = validateYouTubeUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  // Set up SSE for progress streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering on Railway

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let tempFilePath = null;

  try {
    sendEvent('status', { stage: 'fetching_metadata', progress: 5 });

    // Use client-provided metadata if available (already fetched), else fetch
    let metadata = clientMetadata;
    if (!metadata) {
      metadata = await fetchMetadata(url);
    }
    sendEvent('metadata', { metadata });
    sendEvent('status', { stage: 'converting', progress: 10 });

    // Convert to MP3
    tempFilePath = await convertToMp3(url, (progress) => {
      // Map yt-dlp 0-100 progress to our 10-80 range
      const mappedProgress = 10 + Math.round(progress * 0.70);
      sendEvent('status', { stage: 'converting', progress: mappedProgress });
    });

    sendEvent('status', { stage: 'uploading', progress: 82 });

    // Determine storage path
    const userId = req.user?.id;
    const fileName = `${metadata.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)}_${Date.now()}.mp3`;
    const storagePath = userId
      ? `${userId}/${fileName}`
      : `guests/${fileName}`;

    // Upload to Supabase Storage
    const fileBuffer = fs.readFileSync(tempFilePath);
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(storagePath, fileBuffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    sendEvent('status', { stage: 'saving', progress: 92 });

    let songRecord = null;

    // Save to DB if authenticated
    if (userId) {
      const { data: song, error: dbError } = await supabase
        .from('songs')
        .insert({
          user_id: userId,
          title: metadata.title,
          artist: metadata.artist,
          thumbnail_url: metadata.thumbnail_url,
          storage_path: storagePath,
          duration_seconds: metadata.duration_seconds,
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database save failed: ${dbError.message}`);
      }
      songRecord = song;
    }

    // Get a signed URL (1 hour for guests, 7 days for auth users)
    const expiresIn = userId ? 604800 : 3600;
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('audio')
      .createSignedUrl(storagePath, expiresIn);

    if (signedUrlError) {
      throw new Error(`Failed to generate audio URL: ${signedUrlError.message}`);
    }

    sendEvent('complete', {
      song: songRecord || {
        id: null,
        title: metadata.title,
        artist: metadata.artist,
        thumbnail_url: metadata.thumbnail_url,
        storage_path: storagePath,
        duration_seconds: metadata.duration_seconds,
        created_at: new Date().toISOString(),
      },
      audio_url: signedUrlData.signedUrl,
      is_guest: !userId,
    });

    res.end();
  } catch (err) {
    console.error('[Convert] Error:', err.message);
    sendEvent('error', { message: err.message || 'Conversion failed. Please try again.' });
    res.end();
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * POST /api/convert/signed-url
 * Generate a fresh signed URL for a song (signed URLs expire).
 * Security: verifies the user owns the song before generating URL.
 */
router.post('/signed-url', optionalAuth, async (req, res) => {
  const { storage_path, song_id } = req.body;

  if (!storage_path) {
    return res.status(400).json({ error: 'storage_path required' });
  }

  // Security: if song_id provided and user is authenticated, verify ownership
  if (song_id && req.user) {
    const { data: song, error } = await supabase
      .from('songs')
      .select('user_id')
      .eq('id', song_id)
      .single();

    if (error || !song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    if (song.user_id !== req.user.id) {
      // Check if it's accessible via a public playlist
      const { data: publicPlaylistSong } = await supabase
        .from('playlist_songs')
        .select('playlists!inner(is_public)')
        .eq('song_id', song_id)
        .eq('playlists.is_public', true)
        .limit(1);

      if (!publicPlaylistSong || publicPlaylistSong.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
  }

  const { data, error } = await supabase.storage
    .from('audio')
    .createSignedUrl(storage_path, 3600); // 1 hour

  if (error) {
    return res.status(500).json({ error: 'Failed to generate signed URL' });
  }

  res.json({ url: data.signedUrl });
});

/**
 * GET /api/convert/search
 * Search for YouTube videos based on a query.
 */
router.get('/search', async (req, res) => {
  const { q, limit } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const results = await searchYouTube(q, limit ? parseInt(limit) : 10);
    res.json({ results });
  } catch (err) {
    console.error('[Search] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});

/**
 * GET /api/convert/stream?url=<youtubeUrl>
 * Returns a direct audio stream URL for playback.
 */
router.get('/stream', async (req, res) => {
  const { url } = req.query;
  
  const validation = validateYouTubeUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  try {
    const streamUrl = await getStreamUrl(url);
    res.json({ streamUrl });
  } catch (err) {
    console.error('[Stream] Error:', err.message);
    res.status(500).json({ error: 'Failed to resolve stream URL' });
  }
});

module.exports = router;
