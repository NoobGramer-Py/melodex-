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
    { id: '8', name: 'Billie Eilish', image_url: 'https://i.scdn.co/image/ab6761610000e5eb98166c3034237d452093f4e1', spotify_url: '#' },
    { id: '9', name: 'Kanye West', image_url: 'https://i.scdn.co/image/ab6761610000e5eb00922894564c48f2196696db', spotify_url: '#' },
    { id: '10', name: 'Coldplay', image_url: 'https://i.scdn.co/image/ab6761610000e5eb98901edeaf648e283cbcb0b1', spotify_url: '#' },
    { id: '11', name: 'Rihanna', image_url: 'https://i.scdn.co/image/ab67617ad29ca0814d33a6b579047913e735497f', spotify_url: '#' },
    { id: '12', name: 'Kendrick Lamar', image_url: 'https://i.scdn.co/image/ab6761610000e5eb4373142da091f0612fc99066', spotify_url: '#' },
    { id: '13', name: 'Eminem', image_url: 'https://i.scdn.co/image/ab6761610000e5eb6ca5c90113b30c3caddca3bc', spotify_url: '#' },
    { id: '14', name: 'Dua Lipa', image_url: 'https://i.scdn.co/image/ab6761610000e5eb2705e4fb06461f52d005fbc5', spotify_url: '#' },
    { id: '15', name: 'Travis Scott', image_url: 'https://i.scdn.co/image/ab6761610000e5eb1d2799307d896944e0544522', spotify_url: '#' },
    { id: '16', name: 'Bruno Mars', image_url: 'https://i.scdn.co/image/ab6761610000e5eb92eb0940dc71f49638c4c7c5', spotify_url: '#' },
    { id: '17', name: 'Adele', image_url: 'https://i.scdn.co/image/ab6761610000e5eb681ef9436e268f70030283bd', spotify_url: '#' },
    { id: '18', name: 'Arctic Monkeys', image_url: 'https://i.scdn.co/image/ab6761610000e5eb7da39dea0a72f581535fb11f', spotify_url: '#' },
    { id: '19', name: 'Queen', image_url: 'https://i.scdn.co/image/ab6761610000e5eb27339589d97bf97d39a1478f', spotify_url: '#' },
    { id: '20', name: 'The Beatles', image_url: 'https://i.scdn.co/image/ab6761610000e5eb305c4847e930cd0f9a2e6e22', spotify_url: '#' },
    { id: '21', name: 'Snoop Dogg', image_url: 'https://i.scdn.co/image/ab6761610000e5eb1268c149d8a5f8cc02082260', spotify_url: '#' },
    { id: '22', name: 'Arijit Singh', image_url: 'https://i.scdn.co/image/ab6761610000e5eb0261986c7486fc6de1c71a45', spotify_url: '#' },
    { id: '23', name: 'Pritam', image_url: 'https://i.scdn.co/image/ab6761610000e5ebcb1026f7a60216b2a472c686', spotify_url: '#' },
    { id: '24', name: 'A.R. Rahman', image_url: 'https://i.scdn.co/image/ab6761610000e5ebb19af0ea736c622830c8ca2a', spotify_url: '#' },
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
