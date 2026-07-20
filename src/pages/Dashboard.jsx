import { useEffect, useState, useCallback } from "react";
import { Routes, Route, NavLink, useOutletContext, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../lib/spotifyAuth";
import * as api from "../lib/spotifyApi";
import * as analyze from "../lib/analyze";
import { storage } from "../lib/storage";
import BarList from "../components/BarList";
import Donut from "../components/Donut";
import StatCard from "../components/StatCard";

const PERIODS = {
  short_term: "Último mes",
  medium_term: "Últimos 6 meses",
  long_term: "Todo el tiempo",
};

const CACHE_KEY = "dashboard_data";
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hora

async function fetchAll() {
  const [topArtistsShort, topArtistsMedium, topArtistsLong, topTracksShort, topTracksMedium, topTracksLong, recent, saved, playlists] =
    await Promise.all([
      api.getTopArtists("short_term"),
      api.getTopArtists("medium_term"),
      api.getTopArtists("long_term"),
      api.getTopTracks("short_term"),
      api.getTopTracks("medium_term"),
      api.getTopTracks("long_term"),
      api.getRecentlyPlayed(),
      api.getSavedTracks(),
      api.getPlaylists(),
    ]);

  const topArtists = { short_term: topArtistsShort, medium_term: topArtistsMedium, long_term: topArtistsLong };
  const topTracks = { short_term: topTracksShort, medium_term: topTracksMedium, long_term: topTracksLong };

  const trackIds = topTracksMedium.map((t) => t.id).filter(Boolean);
  const features = await api.getAudioFeatures(trackIds);

  const allTracksForDecades = [...saved, ...Object.values(topTracks).flat()];

  return {
    fetchedAt: Date.now(),
    topArtists,
    topTracks,
    genres: analyze.computeGenres(topArtistsMedium),
    decades: analyze.computeDecades(allTracksForDecades),
    albums: analyze.computeAlbums(saved),
    explicit: analyze.computeExplicit(saved),
    avgPopularity: analyze.computeAvgPopularity(saved),
    newDiscoveries: analyze.computeNewDiscoveries(recent, topArtistsLong),
    avgFeatures: analyze.computeAvgFeatures(features),
    playlists,
    savedCount: saved.length,
  };
}

export default function Dashboard() {
  const [data, setData] = useState(() => storage.get(CACHE_KEY));
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async (force = false) => {
    const cached = storage.get(CACHE_KEY);
    if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setData(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fresh = await fetchAll();
      storage.set(CACHE_KEY, fresh);
      setData(fresh);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <main className="center-screen">
        <div className="record-spinner" role="status">
          <p className="label-mono">leyendo tu historial de escucha…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="center-screen">
        <div className="error-box">
          <p className="label-mono">NO SE PUDO CARGAR</p>
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => load(true)}>
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <p className="brand">Contraportada</p>
        <nav>
          <NavLink to="/dashboard" end>Resumen</NavLink>
          <NavLink to="/dashboard/artistas">Artistas y canciones</NavLink>
          <NavLink to="/dashboard/generos">Géneros</NavLink>
          <NavLink to="/dashboard/decadas">Décadas</NavLink>
          <NavLink to="/dashboard/albumes">Álbumes</NavLink>
          <NavLink to="/dashboard/sonido">Perfil sonoro</NavLink>
          <NavLink to="/dashboard/playlists">Playlists</NavLink>
          <NavLink to="/dashboard/nuevos">Descubrimientos</NavLink>
        </nav>
        <div className="sidebar-footer">
          <button className="btn-secondary" onClick={() => load(true)}>
            Actualizar datos
          </button>
          <button className="btn-ghost" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="dashboard-content">
        <Routes>
          <Route element={<Layout data={data} />}>
            <Route index element={<Overview />} />
            <Route path="artistas" element={<ArtistsTracks />} />
            <Route path="generos" element={<Genres />} />
            <Route path="decadas" element={<Decades />} />
            <Route path="albumes" element={<Albums />} />
            <Route path="sonido" element={<Sound />} />
            <Route path="playlists" element={<Playlists />} />
            <Route path="nuevos" element={<Discoveries />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

function Layout({ data }) {
  return <Outlet context={data} />;
}

function useData() {
  return useOutletContext();
}

function Overview() {
  const d = useData();
  const topArtist = d.topArtists.medium_term[0]?.name || "—";
  const topGenre = d.genres[0]?.genre || "—";
  return (
    <section className="section-enter">
      <p className="eyebrow">resumen / cara A</p>
      <h1 className="display">Tu retrato de escucha</h1>
      <div className="stat-grid">
        <StatCard value={d.savedCount} label="Canciones guardadas" />
        <StatCard value={d.avgPopularity ?? "N/D"} label="Popularidad promedio" />
        <StatCard value={`${d.explicit.explicitPct}%`} label="Contenido explícito" />
        <StatCard value={d.playlists.length} label="Playlists" />
        <StatCard value={topArtist} label="Artista #1 (6 meses)" />
        <StatCard value={topGenre} label="Género #1" />
      </div>
      <p className="fine-print" style={{ marginTop: "2rem" }}>
        Última actualización: {new Date(d.fetchedAt).toLocaleString()}
      </p>
    </section>
  );
}

function ArtistsTracks() {
  const d = useData();
  const [period, setPeriod] = useState("medium_term");
  return (
    <section className="section-enter">
      <p className="eyebrow">artistas y canciones</p>
      <h1 className="display">Lo que más suena</h1>
      <div className="period-tabs">
        {Object.entries(PERIODS).map(([key, label]) => (
          <button
            key={key}
            className={period === key ? "tab active" : "tab"}
            onClick={() => setPeriod(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="two-col">
        <div>
          <h3 className="label-mono">top artistas</h3>
          <ol className="tracklist" key={`artists-${period}`}>
            {d.topArtists[period].slice(0, 10).map((a, i) => (
              <li key={a.id} style={{ "--i": i }}>
                <span className="track-num">{String(i + 1).padStart(2, "0")}</span>
                <span>{a.name}</span>
                <span className="muted">{(a.genres || [])[0] || ""}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="label-mono">top canciones</h3>
          <ol className="tracklist" key={`tracks-${period}`}>
            {d.topTracks[period].slice(0, 10).map((t, i) => (
              <li key={t.id} style={{ "--i": i }}>
                <span className="track-num">{String(i + 1).padStart(2, "0")}</span>
                <span>{t.name}</span>
                <span className="muted">{t.artists.map((a) => a.name).join(", ")}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Genres() {
  const d = useData();
  return (
    <section className="section-enter">
      <p className="eyebrow">géneros</p>
      <h1 className="display">Tu mapa de géneros</h1>
      {d.genres.length ? (
        <BarList items={d.genres} labelKey="genre" valueKey="pct" accent="var(--green-bright)" />
      ) : (
        <p className="muted">No hay suficientes datos de géneros todavía.</p>
      )}
    </section>
  );
}

function Decades() {
  const d = useData();
  return (
    <section className="section-enter">
      <p className="eyebrow">décadas</p>
      <h1 className="display">Cuándo se grabó tu música</h1>
      {d.decades.length ? (
        <BarList items={d.decades} labelKey="decade" valueKey="pct" accent="var(--green)" />
      ) : (
        <p className="muted">No hay suficientes datos de fechas de lanzamiento.</p>
      )}
    </section>
  );
}

function Albums() {
  const d = useData();
  return (
    <section className="section-enter">
      <p className="eyebrow">álbumes</p>
      <h1 className="display">Tus álbumes favoritos</h1>
      <p className="fine-print">Según tus canciones guardadas.</p>
      <ol className="tracklist">
        {d.albums.map((a, i) => (
          <li key={a.id} style={{ "--i": i }}>
            <span className="track-num">{String(i + 1).padStart(2, "0")}</span>
            <span>{a.name}</span>
            <span className="muted">{a.artists} — {a.count} canción(es) guardadas</span>
          </li>
        ))}
      </ol>
      {!d.albums.length && <p className="muted">Guarda más canciones en tu biblioteca para ver esto.</p>}
    </section>
  );
}

function Sound() {
  const d = useData();
  return (
    <section className="section-enter">
      <p className="eyebrow">perfil sonoro</p>
      <h1 className="display">Cómo suena tu música</h1>

      <div className="two-col">
        <div>
          <h3 className="label-mono">explícito vs. limpio</h3>
          <Donut
            segments={[
              { label: "Explícito", pct: d.explicit.explicitPct, color: "var(--red)" },
              { label: "Limpio", pct: +(100 - d.explicit.explicitPct).toFixed(1), color: "var(--green-bright)" },
            ]}
          />
        </div>
        <div>
          <h3 className="label-mono">rasgos sonoros promedio</h3>
          {d.avgFeatures ? (
            <>
              <BarList
                items={[
                  { label: "danceability", pct: Math.round(d.avgFeatures.danceability * 100) },
                  { label: "energy", pct: Math.round(d.avgFeatures.energy * 100) },
                  { label: "valence", pct: Math.round(d.avgFeatures.valence * 100) },
                  { label: "acousticness", pct: Math.round(d.avgFeatures.acousticness * 100) },
                  { label: "instrumentalness", pct: Math.round(d.avgFeatures.instrumentalness * 100) },
                  { label: "liveness", pct: Math.round(d.avgFeatures.liveness * 100) },
                  { label: "speechiness", pct: Math.round(d.avgFeatures.speechiness * 100) },
                ]}
                labelKey="label"
                valueKey="pct"
                accent="var(--green)"
              />
              <p className="fine-print">Tempo promedio: {d.avgFeatures.tempo} BPM</p>
            </>
          ) : (
            <p className="muted">
              Tu app no tiene acceso a "audio features" — Spotify restringió este
              endpoint para apps nuevas desde noviembre de 2024.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Playlists() {
  const d = useData();
  return (
    <section className="section-enter">
      <p className="eyebrow">playlists</p>
      <h1 className="display">Tus playlists</h1>
      <p className="fine-print">
        Spotify no expone conteos de reproducción por playlist propia, así que
        no es posible saber cuáles usas más — aquí está el listado completo.
      </p>
      <ol className="tracklist">
        {d.playlists.map((p, i) => (
          <li key={p.id} style={{ "--i": i }}>
            <span className="track-num">{String(i + 1).padStart(2, "0")}</span>
            <span>{p.name}</span>
            <span className="muted">{p.tracks.total} canciones</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Discoveries() {
  const d = useData();
  return (
    <section className="section-enter">
      <p className="eyebrow">descubrimientos</p>
      <h1 className="display">Artistas nuevos para ti</h1>
      <p className="fine-print">
        Artistas en tus reproducciones recientes que no están en tu top histórico.
      </p>
      {d.newDiscoveries.length ? (
        <ol className="tracklist">
          {d.newDiscoveries.map((name, i) => (
            <li key={name} style={{ "--i": i }}>
              <span className="track-num">{String(i + 1).padStart(2, "0")}</span>
              <span>{name}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">No se detectaron artistas nuevos en tus reproducciones recientes.</p>
      )}
    </section>
  );
}
