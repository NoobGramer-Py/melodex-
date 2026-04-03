const express = require('express');
const router = express.Router();
const { searchArtists } = require('../services/spotify');

/**
 * GET /api/artists/search
 * Search for artists via Spotify API (with mock fallback).
 */
router.get('/search', async (req, res) => {
  const { q } = req.query;

  try {
    const results = await searchArtists(q || '');
    res.json({ results });
  } catch (err) {
    console.error('[Artists] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});

module.exports = router;
