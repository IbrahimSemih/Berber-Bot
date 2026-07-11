"use client";
import { useState } from "react";

interface AreaChartData {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaChartData[];
  height?: number;
  color?: string;
  gradientId?: string;
  formatValue?: (v: number) => string;
}

export default function AreaChart({
  data,
  height = 220,
  color = "var(--accent)",
  gradientId = "areaGrad",
  formatValue = (v) => v.toLocaleString("tr-TR"),
}: AreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm" style={{ height, color: "var(--text3)" }}>
        Veri bulunamadı
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 20, bottom: 36, left: 10, right: 10 };
  const chartWidth = 100 - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - (d.value / maxVal) * chartHeight,
  }));

  // Build smooth curve path using cardinal spline
  function buildPath(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  }

  const linePath = buildPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding.top + chartHeight * (1 - ratio);
        return (
          <line key={ratio} x1={padding.left} x2={100 - padding.right} y1={y} y2={y}
            stroke="var(--border)" strokeWidth="0.3" strokeDasharray={ratio === 0 ? "0" : "1 1"} />
        );
      })}

      {/* Y-axis labels */}
      {[0, 0.5, 1].map((ratio) => {
        const y = padding.top + chartHeight * (1 - ratio);
        const val = Math.round(maxVal * ratio);
        return (
          <text key={ratio} x={padding.left - 1} y={y + 1} textAnchor="end"
            fill="var(--text3)" fontSize="2.5" fontFamily="var(--font-dm)">
            {formatValue(val)}
          </text>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="0.6" strokeLinecap="round" />

      {/* Data points and interaction */}
      {points.map((pt, i) => {
        const isHovered = hoveredIndex === i;
        return (
          <g key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: "pointer" }}>

            {/* Invisible hit area */}
            <rect
              x={pt.x - chartWidth / data.length / 2}
              y={padding.top}
              width={chartWidth / data.length}
              height={chartHeight}
              fill="transparent"
            />

            {/* Vertical guide line on hover */}
            {isHovered && (
              <line x1={pt.x} x2={pt.x} y1={padding.top} y2={padding.top + chartHeight}
                stroke={color} strokeWidth="0.3" strokeDasharray="1 1" opacity="0.5" />
            )}

            {/* Dot */}
            <circle cx={pt.x} cy={pt.y} r={isHovered ? 1.5 : 0.8}
              fill={isHovered ? color : "var(--bg2)"}
              stroke={color} strokeWidth="0.5"
              style={{ transition: "all 0.2s" }} />

            {/* Value tooltip on hover */}
            {isHovered && (
              <>
                <rect x={pt.x - 8} y={pt.y - 9} width="16" height="6" rx="1"
                  fill="var(--bg4)" stroke="var(--border2)" strokeWidth="0.3" />
                <text x={pt.x} y={pt.y - 5.2} textAnchor="middle"
                  fill="var(--text)" fontSize="2.8" fontWeight="600" fontFamily="var(--font-dm)">
                  {formatValue(data[i].value)}
                </text>
              </>
            )}

            {/* X-axis label */}
            <text x={pt.x} y={height - 10} textAnchor="middle"
              fill={isHovered ? "var(--text)" : "var(--text3)"}
              fontSize="2.8" fontFamily="var(--font-dm)"
              style={{ transition: "fill 0.2s" }}>
              {data[i].label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
