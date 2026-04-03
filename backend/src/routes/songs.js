const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const supabase = require('../lib/supabase');

/**
 * GET /api/songs
 * Get all songs for the authenticated user.
 */
router.get('/', requireAuth, async (req, res) => {
  const { sort = 'created_at', order = 'desc' } = req.query;

  const validSortColumns = ['created_at', 'title', 'artist'];
  const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? true : false;

  const { data: songs, error } = await supabase
    .from('songs')
    .select('*')
    .eq('user_id', req.user.id)
    .order(sortColumn, { ascending: sortOrder });

  if (error) {
    console.error('[Songs GET]', error.message);
    return res.status(500).json({ error: 'Failed to fetch songs' });
  }

  res.json({ songs });
});

/**
 * POST /api/songs
 * Add a new song (metadata only, usually for online tracks) to the library.
 */
router.post('/', requireAuth, async (req, res) => {
  const { 
    id, title, artist, thumbnail_url, duration_seconds, 
    youtube_id, storage_path, is_liked 
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Use storage_path if provided, otherwise mark as online-only
  const finalStoragePath = storage_path || `online/${youtube_id || id}`;

  const { data: song, error } = await supabase
    .from('songs')
    .insert({
      id: id || undefined,
      user_id: req.user.id,
      title,
      artist,
      thumbnail_url,
      duration_seconds,
      youtube_id,
      storage_path: finalStoragePath,
      is_liked: is_liked || false,
    })
    .select()
    .single();

  if (error) {
    console.error('[Songs POST]', error.message);
    return res.status(500).json({ error: 'Failed to add song to library' });
  }

  res.status(201).json({ song });
});


/**
 * DELETE /api/songs/:id
 * Delete a song and its storage file.
 * Security: verifies ownership before deleting storage and DB record.
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  // Fetch song to verify ownership and get storage path
  const { data: song, error: fetchError } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .single();

  if (fetchError || !song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('audio')
    .remove([song.storage_path]);

  if (storageError) {
    console.warn('[Songs DELETE] Storage removal failed:', storageError.message);
    // Continue with DB deletion even if storage fails
  }

  // Delete from DB (cascade deletes playlist_songs entries)
  const { error: dbError } = await supabase
    .from('songs')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (dbError) {
    console.error('[Songs DELETE] DB error:', dbError.message);
    return res.status(500).json({ error: 'Failed to delete song' });
  }

  res.json({ success: true });
});

/**
 * PATCH /api/songs/:id
 * Update song metadata.
 * Security: verifies ownership.
 */
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Filter allowed update fields
  const allowedUpdates = ['is_liked', 'title', 'artist'];
  const finalUpdates = {};
  for (const field of allowedUpdates) {
    if (updates[field] !== undefined) {
      finalUpdates[field] = updates[field];
    }
  }

  if (Object.keys(finalUpdates).length === 0) {
    return res.status(400).json({ error: 'No valid updates provided' });
  }

  const { data: song, error } = await supabase
    .from('songs')
    .update(finalUpdates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error || !song) {
    console.error('[Songs PATCH]', error?.message || 'Not found');
    return res.status(404).json({ error: 'Song not found or unauthorized' });
  }

  res.json({ song });
});


module.exports = router;
