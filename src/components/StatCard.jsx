import { useEffect, useRef, useState } from "react";

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function StatCard({ value, label }) {
  // Only count up plain integers (e.g. saved-track totals, playlist counts).
  // Percentages, names, and "N/D" are shown as-is with just a fade/pop in.
  const isPlainInt = typeof value === "number" && Number.isInteger(value);
  const [display, setDisplay] = useState(isPlainInt ? 0 : value);
  const frame = useRef();

  useEffect(() => {
    if (!isPlainInt) {
      setDisplay(value);
      return;
    }
    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(value * easeOutExpo(t)));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    }

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="stat-card">
      <p className="stat-value">{display}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}
