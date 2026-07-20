// Genera el par verifier/challenge que exige el flujo Authorization Code + PKCE.
// Todo corre en el navegador con Web Crypto — no se usa ningún secreto.

function randomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

async function sha256(plain) {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createPkcePair() {
  const verifier = randomString(64);
  const challenge = base64UrlEncode(await sha256(verifier));
  return { verifier, challenge };
}

export function randomState() {
  return randomString(16);
}
