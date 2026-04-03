let accessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await response.json();
    if (!data.access_token) throw new Error('No token returned');

    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000;
    return accessToken;
  } catch (err) {
    console.error('[Spotify] Failed to get access token:', err.message);
    return null;
  }
}

/**
 * Searches for artists using Deezer (as a zero-config global catalog search) 
 * or Spotify (if credentials provided).
 */
async function searchArtists(query) {
  const token = await getAccessToken();
  
  if (token) {
    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=15`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return (data.artists?.items || []).map(artist => ({
        id: artist.id,
        name: artist.name,
        image_url: artist.images[0]?.url || artist.images[1]?.url || null,
        spotify_url: artist.external_urls.spotify
      }));
    } catch (err) {
      console.error('[Spotify] Search failed:', err.message);
    }
  }

  // GLOBAL FALLBACK (DEEZER): Works for all artists worldwide without a key!
  try {
    const url = query 
      ? `https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=15`
      : `https://api.deezer.com/chart/0/artists?limit=25`; // Global top artists if no query
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Deezer search results are in .data, chart results are in .data as well
    const items = data.data || [];
    
    return items.map(artist => ({
      id: `deezer-${artist.id}`,
      name: artist.name,
      image_url: artist.picture_medium || artist.picture_big || artist.picture_small,
      spotify_url: artist.link
    }));
  } catch (err) {
    console.error('[Global Catalog] Search failed:', err.message);
    return [];
  }
}

module.exports = { searchArtists };
