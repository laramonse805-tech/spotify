import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCodeForToken } from "../lib/spotifyAuth";

export default function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const authError = params.get("error");

    if (authError) {
      setError(`Spotify devolvió un error: ${authError}`);
      return;
    }
    if (!code) {
      setError("No llegó ningún código de autorización.");
      return;
    }

    exchangeCodeForToken(code, state)
      .then(() => navigate("/dashboard", { replace: true }))
      .catch((e) => setError(e.message));
  }, [navigate]);

  return (
    <main className="center-screen">
      {error ? (
        <div className="error-box">
          <p className="label-mono">ERROR DE AUTENTICACIÓN</p>
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => navigate("/")}>
            Volver a intentar
          </button>
        </div>
      ) : (
        <div className="record-spinner" role="status" aria-label="Conectando">
          <p className="label-mono">conectando con spotify…</p>
        </div>
      )}
    </main>
  );
}
