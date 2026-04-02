import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL as string;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Opens an SSE connection to the conversion endpoint.
 * Returns a cleanup function.
 */
export async function startConversionStream(
  url: string,
  metadata: object | null,
  onEvent: (event: string, data: unknown) => void,
  onError: (message: string) => void
): Promise<() => void> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/convert/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url, metadata }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Conversion failed' }));
    throw new Error(error.error || 'Conversion failed');
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let cancelled = false;

  const read = async () => {
    while (!cancelled) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = 'message';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onEvent(currentEvent, data);
            if (currentEvent === 'error') {
              onError(data.message || 'Unknown error');
            }
          } catch {
            // malformed SSE line — skip
          }
          currentEvent = 'message';
        }
      }
    }
  };

  read().catch((err) => {
    if (!cancelled) onError(err.message);
  });

  return () => {
    cancelled = true;
    reader.cancel();
  };
}

export async function fetchMetadata(youtubeUrl: string) {
  return apiFetch<{ metadata: import('../types').ConversionMetadata }>(
    '/api/convert/metadata',
    {
      method: 'POST',
      body: JSON.stringify({ url: youtubeUrl }),
    }
  );
}

export async function fetchSignedUrl(storagePath: string, songId?: string): Promise<string> {
  const result = await apiFetch<{ url: string }>('/api/convert/signed-url', {
    method: 'POST',
    body: JSON.stringify({ storage_path: storagePath, song_id: songId }),
  });
  return result.url;
}

export async function fetchSongs(sort = 'created_at', order = 'desc') {
  return apiFetch<{ songs: import('../types').Song[] }>(
    `/api/songs?sort=${sort}&order=${order}`
  );
}

export async function deleteSong(id: string) {
  return apiFetch<{ success: boolean }>(`/api/songs/${id}`, { method: 'DELETE' });
}

export async function fetchPlaylists() {
  return apiFetch<{ playlists: import('../types').Playlist[] }>('/api/playlists');
}

export async function fetchPlaylist(id: string) {
  return apiFetch<{
    playlist: import('../types').Playlist;
    songs: import('../types').Song[];
    is_owner: boolean;
  }>(`/api/playlists/${id}`);
}

export async function createPlaylist(name: string, isPublic = false) {
  return apiFetch<{ playlist: import('../types').Playlist }>('/api/playlists', {
    method: 'POST',
    body: JSON.stringify({ name, is_public: isPublic }),
  });
}

export async function updatePlaylist(id: string, updates: { name?: string; is_public?: boolean }) {
  return apiFetch<{ playlist: import('../types').Playlist }>(`/api/playlists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deletePlaylist(id: string) {
  return apiFetch<{ success: boolean }>(`/api/playlists/${id}`, { method: 'DELETE' });
}

export async function addSongToPlaylist(playlistId: string, songId: string) {
  return apiFetch<{ entry: object }>(`/api/playlists/${playlistId}/songs`, {
    method: 'POST',
    body: JSON.stringify({ song_id: songId }),
  });
}

export async function removeSongFromPlaylist(playlistId: string, songId: string) {
  return apiFetch<{ success: boolean }>(`/api/playlists/${playlistId}/songs/${songId}`, {
    method: 'DELETE',
  });
}

export async function reorderPlaylistSongs(
  playlistId: string,
  order: { song_id: string; position: number }[]
) {
  return apiFetch<{ success: boolean }>(`/api/playlists/${playlistId}/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ order }),
  });
}
