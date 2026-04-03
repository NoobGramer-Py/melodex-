const { execFile, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const execFileAsync = promisify(execFile);

const TEMP_DIR = process.env.TEMP_DIR || '/tmp/melodex-conversions';
const MAX_DURATION_SECONDS = 1200; // 20 minutes max

// Simple in-memory cache for search results
const searchCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Cache for direct stream URLs (YouTube stream URLs usually expire in 6 hours, we'll cache for 3 hours)
const streamUrlCache = new Map();
const CACHE_TTL_STREAM = 3 * 60 * 60 * 1000; 


/**
 * Validates that the URL is a YouTube URL and not something dangerous.
 * Security: prevents SSRF by whitelisting YouTube domains only.
 */
function validateYouTubeUrl(url) {
  try {
    const parsed = new URL(url);
    const validHosts = [
      'youtube.com',
      'www.youtube.com',
      'youtu.be',
      'm.youtube.com',
      'music.youtube.com',
    ];
    if (!validHosts.includes(parsed.hostname)) {
      return { valid: false, reason: 'Only YouTube URLs are supported' };
    }
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return { valid: false, reason: 'Invalid URL protocol' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

/**
 * Fetches metadata from YouTube without downloading.
 */
async function fetchMetadata(youtubeUrl) {
  const args = [
    '--dump-json',
    '--no-playlist',
    '--no-warnings',
    '--quiet',
    youtubeUrl,
  ];

  const { stdout } = await execFileAsync('yt-dlp', args, {
    timeout: 30000,
    maxBuffer: 5 * 1024 * 1024,
  });

  const info = JSON.parse(stdout);

  if (info.duration && info.duration > MAX_DURATION_SECONDS) {
    throw new Error(`Video too long. Maximum allowed duration is ${MAX_DURATION_SECONDS / 60} minutes.`);
  }

  return {
    title: info.title || 'Unknown Title',
    artist: info.uploader || info.channel || 'Unknown Artist',
    thumbnail_url: info.thumbnail || getBestThumbnail(info.thumbnails),
    duration_seconds: Math.round(info.duration || 0),
    youtube_id: info.id,
  };
}

function getBestThumbnail(thumbnails) {
  if (!thumbnails || !thumbnails.length) return null;
  // Prefer maxresdefault or hqdefault
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0]?.url || null;
}

/**
 * Gets a direct playable audio stream URL for a YouTube video.
 */
async function getStreamUrl(youtubeUrl) {
  const now = Date.now();
  if (streamUrlCache.has(youtubeUrl)) {
    const { timestamp, url } = streamUrlCache.get(youtubeUrl);
    if (now - timestamp < CACHE_TTL_STREAM) {
       return url;
    }
  }

  const args = [
    '-f', 'ba', // best audio
    '-g',       // get URL
    '--no-playlist',
    '--no-warnings',
    youtubeUrl,
  ];

  const { stdout } = await execFileAsync('yt-dlp', args, {
    timeout: 15000,
  });

  const streamUrl = stdout.trim();
  streamUrlCache.set(youtubeUrl, { timestamp: now, url: streamUrl });
  return streamUrl;
}


/**
 * Downloads and converts a YouTube video to MP3.
 * Returns the path to the output file.
 */
async function convertToMp3(youtubeUrl, onProgress) {
  const jobId = uuidv4();
  const outputPath = path.join(TEMP_DIR, `${jobId}.mp3`);

  // yt-dlp args: extract audio, convert to mp3 via ffmpeg, embed thumbnail
  const args = [
    '--no-playlist',
    '--no-warnings',
    '--extract-audio',
    '--audio-format', 'mp3',
    '--audio-quality', '192K',
    '--embed-thumbnail',
    '--add-metadata',
    '--postprocessor-args', 'ffmpeg:-id3v2_version 3',
    '-o', outputPath.replace('.mp3', '.%(ext)s'),
    '--newline', // line-buffered progress output
    youtubeUrl,
  ];

  return new Promise((resolve, reject) => {
    const child = execFile('yt-dlp', args, {
      timeout: 300000, // 5 min max
      maxBuffer: 10 * 1024 * 1024,
    });

    let errorOutput = '';
    let progressPercent = 0;

    child.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        // Parse yt-dlp progress output: [download]  xx.x% of ...
        const progressMatch = line.match(/\[download\]\s+([\d.]+)%/);
        if (progressMatch) {
          progressPercent = Math.min(95, parseFloat(progressMatch[1]));
          onProgress?.(progressPercent);
        }
      }
    });

    child.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp failed with code ${code}: ${errorOutput.slice(0, 500)}`));
        return;
      }

      // yt-dlp writes the file without .mp3 extension sometimes, find it
      const expectedPath = outputPath;
      const altPath = outputPath.replace('.mp3', '.mp3.mp3');

      if (fs.existsSync(expectedPath)) {
        onProgress?.(100);
        resolve(expectedPath);
      } else if (fs.existsSync(altPath)) {
        fs.renameSync(altPath, expectedPath);
        onProgress?.(100);
        resolve(expectedPath);
      } else {
        // Scan temp dir for the jobId file
        const files = fs.readdirSync(TEMP_DIR);
        const match = files.find(f => f.startsWith(jobId));
        if (match) {
          const matchPath = path.join(TEMP_DIR, match);
          fs.renameSync(matchPath, expectedPath);
          onProgress?.(100);
          resolve(expectedPath);
        } else {
          reject(new Error('Conversion completed but output file not found'));
        }
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}. Is yt-dlp installed?`));
    });
  });
}

/**
 * Cleans up a temp file after upload.
 */
function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn('[Cleanup] Failed to delete temp file:', filePath, err.message);
  }
}

/**
 * Searches for videos on YouTube and returns a list of results.
 */
async function searchYouTube(query, limit = 10) {
  const cacheKey = `${query.toLowerCase()}_${limit}`;
  const now = Date.now();
  
  if (searchCache.has(cacheKey)) {
    const { timestamp, results } = searchCache.get(cacheKey);
    if (now - timestamp < CACHE_TTL) {
      return results;
    }
  }

  const args = [
    `ytsearch${limit}:${query} official audio`,
    '--flat-playlist', // EXTREMELY IMPORTANT for speed: only fetch search result page metadata
    '--print-json',    // Use print-json for speed over dump-json
    '--no-playlist',
    '--no-warnings',
    '--quiet',
  ];

  try {
    const { stdout } = await execFileAsync('yt-dlp', args, {
      timeout: 15000, // Reduced timeout for snappier feedback
      maxBuffer: 10 * 1024 * 1024,
    });

    const results = stdout
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          const info = JSON.parse(line);
          return {
            id: info.id || `yt-${Date.now()}-${Math.random()}`,
            title: info.title || 'Unknown Title',
            artist: info.uploader || info.channel || 'Unknown Artist',
            thumbnail_url: info.thumbnails?.[0]?.url || info.thumbnail || '',
            duration_seconds: Math.round(info.duration || 0),
            youtube_id: info.id,
            storage_path: '', // Mark as online song
            audio_url: `https://www.youtube.com/watch?v=${info.id}`,
            created_at: new Date().toISOString(),
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    searchCache.set(cacheKey, { timestamp: now, results });
    return results;
  } catch (err) {
    console.error('[Search] yt-dlp search failed:', err.message);
    // If it's a timeout error but we have stale cache, return it
    if (err.message.includes('timeout') && searchCache.has(cacheKey)) {
      return searchCache.get(cacheKey).results;
    }
    throw new Error('Search failed. Please try again.');
  }
}

module.exports = {
  validateYouTubeUrl,
  fetchMetadata,
  convertToMp3,
  cleanupTempFile,
  searchYouTube,
  getStreamUrl,
};
