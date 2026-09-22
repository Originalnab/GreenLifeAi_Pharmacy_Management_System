import React, { useState } from 'react';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
  darkColor?: string;
}

interface DonutChartProps {
  title: string;
  subtitle?: string;
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  formatValue?: (v: number) => string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  title, subtitle, segments, centerLabel, centerValue, formatValue,
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const rawTotal = segments.reduce((a, s) => a + (Number(s.value) || 0), 0);
  const total = rawTotal > 0 ? rawTotal : 1;
  const fmt = formatValue ?? ((v: number) => v.toString());

  // Build SVG arcs
  const cx = 60, cy = 60, r = 48, innerR = 30;

  let cumulativeAngle = -90;
  const arcs = segments.map((seg, i) => {
    if (rawTotal === 0 || !seg.value || isNaN(seg.value)) {
      return { ...seg, path: '', pct: 0, index: i };
    }
    const pct = seg.value / total;
    const angle = Math.min(359.99, pct * 360);
    const start = cumulativeAngle;
    cumulativeAngle += angle;
    const end = cumulativeAngle;

    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const xi1 = cx + innerR * Math.cos(toRad(start));
    const yi1 = cy + innerR * Math.sin(toRad(start));
    const xi2 = cx + innerR * Math.cos(toRad(end));
    const yi2 = cy + innerR * Math.sin(toRad(end));
    const largeArc = angle > 180 ? 1 : 0;

    const path = pct >= 0.999
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} L ${cx - 0.01} ${cy - innerR} A ${innerR} ${innerR} 0 1 0 ${cx} ${cy - innerR} Z`
      : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1} Z`;

    return { ...seg, path, pct, index: i };
  });

  const activeSegment = hovered !== null ? segments[hovered] : null;

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-6">
        {/* SVG Donut */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            {rawTotal === 0 ? (
              <circle
                cx="60"
                cy="60"
                r={(r + innerR) / 2}
                fill="none"
                stroke="currentColor"
                strokeWidth={r - innerR}
                className="text-slate-100 dark:text-slate-800"
              />
            ) : (
              arcs.filter(a => a.path).map((arc, i) => (
                <path
                  key={i}
                  d={arc.path}
                  fill={arc.color}
                  onMouseEnter={() => setHovered(arc.index)}
                  onMouseLeave={() => setHovered(null)}
                  className="transition-opacity cursor-pointer"
                  style={{ opacity: hovered === null || hovered === arc.index ? 1 : 0.4 }}
                />
              ))
            )}
            {/* Center text */}
            <text x="60" y="54" textAnchor="middle" className="fill-slate-900 dark:fill-white"
              style={{ fontSize: 9, fontWeight: 700, fontFamily: 'inherit' }}>
              {activeSegment ? activeSegment.label : (centerLabel ?? 'Total')}
            </text>
            <text x="60" y="68" textAnchor="middle" className="fill-slate-900 dark:fill-white"
              style={{ fontSize: 11, fontWeight: 800, fontFamily: 'inherit' }}>
              {activeSegment ? fmt(activeSegment.value) : (centerValue ?? fmt(rawTotal))}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {segments.map((seg, i) => {
            const pct = ((seg.value / total) * 100).toFixed(1);
            return (
              <div
                key={i}
                className={`flex items-center justify-between gap-2 cursor-pointer transition-opacity ${
                  hovered === null || hovered === i ? 'opacity-100' : 'opacity-40'
                }`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{seg.label}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white">{fmt(seg.value)}</p>
                  <p className="text-[10px] text-slate-400">{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
