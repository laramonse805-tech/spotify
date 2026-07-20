import { useEffect, useState } from "react";

export default function BarList({ items, valueKey = "pct", labelKey = "label", suffix = "%", accent = "var(--green)" }) {
  const max = Math.max(...items.map((i) => i[valueKey]), 1);
  const [mounted, setMounted] = useState(false);
  const key = items.map((i) => i[labelKey]).join("|");

  useEffect(() => {
    // Re-trigger the grow-in animation whenever the underlying items change
    // (e.g. switching period tabs), not just on first mount.
    setMounted(false);
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [key]);

  return (
    <div className="bar-list">
      {items.map((item, idx) => (
        <div className="bar-row" style={{ "--i": idx }} key={item[labelKey] + idx}>
          <span className="bar-label">{item[labelKey]}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: mounted ? `${(item[valueKey] / max) * 100}%` : "0%", background: accent }}
            />
          </div>
          <span className="bar-value">
            {item[valueKey]}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
