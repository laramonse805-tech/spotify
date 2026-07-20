import { getValidAccessToken } from "./spotifyAuth";

const BASE = "https://api.spotify.com/v1";

async function apiGet(path, params = {}) {
  const token = await getValidAccessToken();
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403) return { forbidden: true };
  if (!res.ok) throw new Error(`Spotify API error ${res.status} en ${path}`);
  return res.json();
}

export async function getTopArtists(timeRange, limit = 50) {
  const data = await apiGet("/me/top/artists", { time_range: timeRange, limit });
  return data.items || [];
}

export async function getTopTracks(timeRange, limit = 50) {
  const data = await apiGet("/me/top/tracks", { time_range: timeRange, limit });
  return data.items || [];
}

export async function getRecentlyPlayed(limit = 50) {
  const data = await apiGet("/me/player/recently-played", { limit });
  return (data.items || []).map((i) => i.track);
}

export async function getSavedTracks(maxItems = 300) {
  const items = [];
  let offset = 0;
  while (offset < maxItems) {
    const data = await apiGet("/me/tracks", { limit: 50, offset });
    const batch = (data.items || []).map((i) => i.track);
    items.push(...batch);
    if (!data.items || data.items.length < 50) break;
    offset += 50;
  }
  return items;
}

export async function getPlaylists() {
  const playlists = [];
  let offset = 0;
  while (true) {
    const data = await apiGet("/me/playlists", { limit: 50, offset });
    playlists.push(...(data.items || []));
    if (!data.items || data.items.length < 50) break;
    offset += 50;
  }
  return playlists;
}

export async function getAudioFeatures(trackIds) {
  const all = [];
  for (let i = 0; i < trackIds.length; i += 100) {
    const chunk = trackIds.slice(i, i + 100);
    const data = await apiGet("/audio-features", { ids: chunk.join(",") });
    if (data.forbidden) return null; // app sin acceso (restricción de Spotify desde 2024)
    all.push(...(data.audio_features || []).filter(Boolean));
  }
  return all.length ? all : null;
}
