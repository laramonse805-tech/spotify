import { useNavigate } from "react-router-dom";
import { redirectToSpotifyAuthorize, isLoggedIn } from "../lib/spotifyAuth";
import { useEffect } from "react";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) navigate("/dashboard", { replace: true });
  }, [navigate]);

  return (
    <main className="login-hero">
      <div className="groove-ring" aria-hidden="true" />
      <div className="login-content">
        <p className="eyebrow">contraportada / notas de forro</p>
        <h1 className="display">
          Tu año en <em>música</em>,
          <br />
          leído como un forro de vinilo.
        </h1>
        <p className="lede">
          Nada de resúmenes genéricos. Conectamos directo a tu cuenta de
          Spotify y leemos tus propios datos de escucha: artistas, géneros,
          décadas, hábitos y más — todo procesado en tu navegador.
        </p>
        <button className="btn-primary" onClick={redirectToSpotifyAuthorize}>
          Conectar con Spotify →
        </button>
        <p className="fine-print">
          Usamos el flujo estándar de autorización de Spotify. No pedimos ni
          almacenamos tu contraseña. Tus datos se guardan solo en este
          navegador (Local Storage).
        </p>
      </div>
    </main>
  );
}
