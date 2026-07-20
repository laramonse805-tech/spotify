import { useEffect, useState } from "react";

export default function Donut({ segments, size = 160, stroke = 22 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  let offsetAcc = 0;

  return (
    <div className="donut-wrap">
      <svg className="donut-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((seg, idx) => {
            const pct = mounted ? seg.pct : 0;
            const dash = (pct / 100) * circumference;
            const gap = circumference - dash;
            const circle = (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offsetAcc}
                strokeLinecap="butt"
                style={{ transitionDelay: `${idx * 0.1}s` }}
              />
            );
            offsetAcc += (seg.pct / 100) * circumference;
            return circle;
          })}
        </g>
      </svg>
      <ul className="donut-legend">
        {segments.map((seg, idx) => (
          <li key={idx} style={{ "--i": idx }}>
            <span className="dot" style={{ background: seg.color, "--i": idx }} />
            {seg.label} — {seg.pct}%
          </li>
        ))}
      </ul>
    </div>
  );
}
