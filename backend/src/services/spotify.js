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
    tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000; // 1 min buffer
    return accessToken;
  } catch (err) {
    console.error('[Spotify] Failed to get access token:', err.message);
    return null;
  }
}

async function searchArtists(query) {
  const token = await getAccessToken();
  
  if (!token) {
    // Fallback if no credentials
    return getMockArtists(query);
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`, {
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
    return getMockArtists(query);
  }
}

function getMockArtists(query) {
  const common = [
    { id: '1', name: 'The Weeknd', image_url: 'https://i.scdn.co/image/ab6761610000e5ebc8d117fc605198c1f9e9a7e8', spotify_url: '#' },
    { id: '2', name: 'Taylor Swift', image_url: 'https://i.scdn.co/image/ab6761610000e5eb859fe2d861e6005d43806a6b', spotify_url: '#' },
    { id: '3', name: 'Drake', image_url: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324da85581797c37', spotify_url: '#' },
    { id: '4', name: 'Ariana Grande', image_url: 'https://i.scdn.co/image/ab6761610000e5ebcdce47d3d758079024f0ca0a', spotify_url: '#' },
    { id: '5', name: 'Ed Sheeran', image_url: 'https://i.scdn.co/image/ab6761610000e5eb12826c406085a669bc05278c', spotify_url: '#' },
    { id: '6', name: 'Justin Bieber', image_url: 'https://i.scdn.co/image/ab6761610000e5eb8ae7f614e4cb47bc330559f3', spotify_url: '#' },
    { id: '7', name: 'Post Malone', image_url: 'https://i.scdn.co/image/ab6761610000e5eb6be8da7890ec59392e666270', spotify_url: '#' },
  ];

  const results = common.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
  
  if (results.length === 0) {
    return [{
       id: `mock-${query}`,
       name: query,
       image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(query)}&background=random&size=200`,
       spotify_url: '#'
    }];
  }

  return results;
}

module.exports = { searchArtists };
