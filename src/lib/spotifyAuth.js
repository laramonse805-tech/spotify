import { createPkcePair, randomState } from "./pkce";
import { storage } from "./storage";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
export const REDIRECT_URI = `${window.location.origin}/callback`;

const SCOPES = [
  "user-top-read",
  "user-read-recently-played",
  "user-library-read",
  "playlist-read-private",
  "user-read-private",
].join(" ");

export async function redirectToSpotifyAuthorize() {
  const { verifier, challenge } = await createPkcePair();
  const state = randomState();
  storage.set("pkce_verifier", verifier);
  storage.set("oauth_state", state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCodeForToken(code, state) {
  const expectedState = storage.get("oauth_state");
  if (!state || state !== expectedState) {
    throw new Error("El parámetro 'state' no coincide. Intenta iniciar sesión de nuevo.");
  }
  const verifier = storage.get("pkce_verifier");
  if (!verifier) throw new Error("Falta el code_verifier. Intenta iniciar sesión de nuevo.");

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`No se pudo obtener el token: ${errText}`);
  }

  const data = await res.json();
  saveTokens(data);
  storage.remove("pkce_verifier");
  storage.remove("oauth_state");
  return data;
}

async function refreshAccessToken() {
  const refreshToken = storage.get("refresh_token");
  if (!refreshToken) throw new Error("No hay refresh token; inicia sesión de nuevo.");

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error("No se pudo refrescar el token.");
  const data = await res.json();
  saveTokens(data);
  return data.access_token;
}

function saveTokens(data) {
  storage.set("access_token", data.access_token);
  if (data.refresh_token) storage.set("refresh_token", data.refresh_token);
  storage.set("expires_at", Date.now() + data.expires_in * 1000 - 30_000);
}

export async function getValidAccessToken() {
  const token = storage.get("access_token");
  const expiresAt = storage.get("expires_at");
  if (token && expiresAt && Date.now() < expiresAt) return token;
  return refreshAccessToken();
}

export function isLoggedIn() {
  return Boolean(storage.get("refresh_token"));
}

export function logout() {
  storage.clearAll();
}
