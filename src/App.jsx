import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Callback from "./pages/Callback";
import Dashboard from "./pages/Dashboard";
import { isLoggedIn } from "./lib/spotifyAuth";

function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/callback" element={<Callback />} />
      <Route
        path="/dashboard/*"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
