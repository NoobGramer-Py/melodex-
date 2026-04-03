const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const supabase = require('../lib/supabase');

/**
 * GET /api/playlists
 * Get all playlists for the authenticated user, with song counts.
 */
router.get('/', requireAuth, async (req, res) => {
  const { data: rawPlaylists, error } = await supabase
    .from('playlists')
    .select(`
      *,
      playlist_songs (
        songs (
          duration_seconds,
          thumbnail_url
        )
      )
    `)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Playlists GET]', error.message);
    return res.status(500).json({ error: 'Failed to fetch playlists' });
  }

  // Calculate computed fields for unified frontend consumption
  const playlists = rawPlaylists.map(p => {
    const songs = (p.playlist_songs || [])
      .map(ps => ps.songs)
      .filter(Boolean);

    return {
      ...p,
      song_count: songs.length,
      total_duration: songs.reduce((sum, song) => sum + (song.duration_seconds || 0), 0),
      cover_thumbnail: songs[0]?.thumbnail_url || null,
      playlist_songs: undefined // Remove junction data before sending to client
    };
  });

  res.json({ playlists });
});


/**
 * GET /api/playlists/:id
 * Get a single playlist with its songs.
 * Public playlists accessible without auth.
 */
router.get('/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;

  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', id)
    .single();

  if (playlistError || !playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  // Security: only allow access to private playlists if owner
  if (!playlist.is_public) {
    if (!req.user || req.user.id !== playlist.user_id) {
      return res.status(403).json({ error: 'This playlist is private' });
    }
  }

  // Fetch songs in order
  const { data: playlistSongs, error: songsError } = await supabase
    .from('playlist_songs')
    .select(`
      id,
      position,
      songs (*)
    `)
    .eq('playlist_id', id)
    .order('position', { ascending: true });

  if (songsError) {
    return res.status(500).json({ error: 'Failed to fetch playlist songs' });
  }

  res.json({
    playlist,
    songs: playlistSongs.map(ps => ({ ...ps.songs, playlist_entry_id: ps.id, position: ps.position })),
    is_owner: req.user?.id === playlist.user_id,
  });
});

/**
 * POST /api/playlists
 * Create a new playlist.
 */
router.post('/', requireAuth, async (req, res) => {
  const { name, is_public = false } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Playlist name is required' });
  }

  if (name.length > 100) {
    return res.status(400).json({ error: 'Playlist name must be 100 characters or less' });
  }

  const { data: playlist, error } = await supabase
    .from('playlists')
    .insert({
      user_id: req.user.id,
      name: name.trim(),
      is_public: Boolean(is_public),
    })
    .select()
    .single();

  if (error) {
    console.error('[Playlists POST]', error.message);
    return res.status(500).json({ error: 'Failed to create playlist' });
  }

  // Consistent structure with GET /api/playlists
  const playlistWithDefaults = {
    ...playlist,
    song_count: 0,
    total_duration: 0,
    cover_thumbnail: null,
  };

  res.status(201).json({ playlist: playlistWithDefaults });
});


/**
 * PATCH /api/playlists/:id
 * Update playlist name or visibility.
 */
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, is_public } = req.body;

  const updates = {};
  if (name !== undefined) {
    if (name.trim().length === 0) {
      return res.status(400).json({ error: 'Playlist name cannot be empty' });
    }
    updates.name = name.trim().slice(0, 100);
  }
  if (is_public !== undefined) {
    updates.is_public = Boolean(is_public);
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const { data: playlist, error } = await supabase
    .from('playlists')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error || !playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  res.json({ playlist });
});

/**
 * DELETE /api/playlists/:id
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete playlist' });
  }

  res.json({ success: true });
});

/**
 * POST /api/playlists/:id/songs
 * Add a song to a playlist.
 */
router.post('/:id/songs', requireAuth, async (req, res) => {
  const { id: playlistId } = req.params;
  const { song_id } = req.body;

  if (!song_id) {
    return res.status(400).json({ error: 'song_id is required' });
  }

  // Verify playlist ownership
  const { data: playlist } = await supabase
    .from('playlists')
    .select('user_id')
    .eq('id', playlistId)
    .eq('user_id', req.user.id)
    .single();

  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  // Verify song ownership
  const { data: song } = await supabase
    .from('songs')
    .select('id')
    .eq('id', song_id)
    .eq('user_id', req.user.id)
    .single();

  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  // Get next position
  const { data: lastEntry } = await supabase
    .from('playlist_songs')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = lastEntry ? lastEntry.position + 1 : 0;

  const { data: entry, error } = await supabase
    .from('playlist_songs')
    .insert({ playlist_id: playlistId, song_id, position })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Song already in playlist' });
    }
    return res.status(500).json({ error: 'Failed to add song to playlist' });
  }

  res.status(201).json({ entry });
});

/**
 * DELETE /api/playlists/:id/songs/:songId
 * Remove a song from a playlist.
 */
router.delete('/:id/songs/:songId', requireAuth, async (req, res) => {
  const { id: playlistId, songId } = req.params;

  // Verify playlist ownership
  const { data: playlist } = await supabase
    .from('playlists')
    .select('user_id')
    .eq('id', playlistId)
    .eq('user_id', req.user.id)
    .single();

  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  const { error } = await supabase
    .from('playlist_songs')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('song_id', songId);

  if (error) {
    return res.status(500).json({ error: 'Failed to remove song from playlist' });
  }

  res.json({ success: true });
});

/**
 * PATCH /api/playlists/:id/reorder
 * Reorder songs in a playlist.
 * Body: { order: [{ song_id: string, position: number }] }
 */
router.patch('/:id/reorder', requireAuth, async (req, res) => {
  const { id: playlistId } = req.params;
  const { order } = req.body;

  if (!Array.isArray(order) || order.length === 0) {
    return res.status(400).json({ error: 'order array is required' });
  }

  // Verify ownership
  const { data: playlist } = await supabase
    .from('playlists')
    .select('user_id')
    .eq('id', playlistId)
    .eq('user_id', req.user.id)
    .single();

  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  // Update positions in bulk
  const updates = order.map(({ song_id, position }) =>
    supabase
      .from('playlist_songs')
      .update({ position })
      .eq('playlist_id', playlistId)
      .eq('song_id', song_id)
  );

  await Promise.all(updates);

  res.json({ success: true });
});

module.exports = router;
