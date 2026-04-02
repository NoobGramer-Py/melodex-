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

module.exports = router;
