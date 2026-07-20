# Contraportada — tu año en música

App web (Vite + React + React Router) que se conecta a tu cuenta de Spotify
y genera un análisis de tus hábitos de escucha, guardado en Local Storage.

## Requisitos

- Node.js 18 o superior
- Una app creada en el [Dashboard de Spotify for Developers](https://developer.spotify.com/dashboard)

## 1. Configura el Redirect URI en Spotify

En tu app de Spotify (Settings > Redirect URIs), agrega exactamente:

```
http://127.0.0.1:5173/callback
```

Guarda los cambios.

## 2. Configura tu Client ID

No necesitas el Client Secret — este proyecto usa el flujo **Authorization
Code con PKCE**, diseñado para apps que corren en el navegador, donde no es
seguro guardar un secreto.

```bash
cp .env.example .env
```

Edita `.env` y pon tu Client ID:

```
VITE_SPOTIFY_CLIENT_ID=tu_client_id_aqui
```

## 3. Instala y corre

```bash
npm install
npm run dev
```

Abre `http://127.0.0.1:5173`, conecta tu cuenta y explora tu reporte.

## Qué incluye

- Top artistas y canciones (último mes / 6 meses / histórico)
- Géneros más escuchados
- Décadas favoritas
- Álbumes favoritos (según tu biblioteca guardada)
- Contenido explícito vs. limpio
- Popularidad promedio
- Perfil sonoro (danceability, energy, valence, etc.) — si tu app tiene acceso
- Playlists
- Artistas descubiertos recientemente

## Limitaciones de la API de Spotify (no son un bug de esta app)

- **Audio features** y **Recommendations** están restringidos para apps
  nuevas desde noviembre de 2024. La app lo detecta y muestra un aviso en
  vez de fallar.
- Spotify no expone conteos de reproducción por playlist propia — no es
  posible saber cuáles usas más.
- Spotify no provee el idioma de las canciones.

## Dónde viven tus datos

Todo el procesamiento pasa en tu navegador. El token de acceso y los datos
analizados se guardan en `localStorage` bajo el prefijo
`spotify_analyzer:`. "Cerrar sesión" en el sidebar los borra.
