function decadeOf(releaseDate) {
  if (!releaseDate) return null;
  const year = parseInt(releaseDate.slice(0, 4), 10);
  if (Number.isNaN(year)) return null;
  return `${Math.floor(year / 10) * 10}s`;
}

export function computeGenres(mediumTermArtists) {
  const counts = new Map();
  for (const a of mediumTermArtists) {
    for (const g of a.genres || []) {
      counts.set(g, (counts.get(g) || 0) + 1);
    }
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([genre, count]) => ({ genre, count, pct: +((count / total) * 100).toFixed(1) }));
}

export function computeDecades(tracks) {
  const counts = new Map();
  const seen = new Set();
  for (const t of tracks) {
    if (!t || seen.has(t.id)) continue;
    seen.add(t.id);
    const d = decadeOf(t.album?.release_date);
    if (!d) continue;
    counts.set(d, (counts.get(d) || 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([decade, count]) => ({ decade, count, pct: +((count / total) * 100).toFixed(1) }));
}

export function computeAlbums(savedTracks) {
  const counts = new Map();
  const info = new Map();
  for (const t of savedTracks) {
    if (!t) continue;
    const alb = t.album;
    counts.set(alb.id, (counts.get(alb.id) || 0) + 1);
    info.set(alb.id, {
      name: alb.name,
      artists: alb.artists.map((a) => a.name).join(", "),
      image: alb.images?.[2]?.url || alb.images?.[0]?.url,
    });
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count, ...info.get(id) }));
}

export function computeExplicit(savedTracks) {
  const explicit = savedTracks.filter((t) => t?.explicit).length;
  const clean = savedTracks.length - explicit;
  const total = explicit + clean || 1;
  return { explicit, clean, explicitPct: +((explicit / total) * 100).toFixed(1) };
}

export function computeAvgPopularity(savedTracks) {
  const pops = savedTracks.filter(Boolean).map((t) => t.popularity);
  if (!pops.length) return null;
  return +(pops.reduce((a, b) => a + b, 0) / pops.length).toFixed(1);
}

export function computeNewDiscoveries(recentTracks, longTermArtists) {
  const longTermIds = new Set(longTermArtists.map((a) => a.id));
  const found = new Map();
  for (const t of recentTracks) {
    for (const a of t.artists || []) {
      if (!longTermIds.has(a.id)) found.set(a.id, a.name);
    }
  }
  return [...found.values()].sort().slice(0, 20);
}

export function computeAvgFeatures(features) {
  if (!features || !features.length) return null;
  const keys = [
    "danceability",
    "energy",
    "valence",
    "acousticness",
    "instrumentalness",
    "liveness",
    "speechiness",
  ];
  const avg = {};
  for (const k of keys) {
    avg[k] = +(features.reduce((sum, f) => sum + f[k], 0) / features.length).toFixed(3);
  }
  avg.tempo = Math.round(features.reduce((sum, f) => sum + f.tempo, 0) / features.length);
  return avg;
}
