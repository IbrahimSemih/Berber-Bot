"use client";
import { useState } from "react";

interface BarChartData {
  label: string;
  value: number;
  value2?: number;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  barColor?: string;
  barColor2?: string;
  showValues?: boolean;
  label1?: string;
  label2?: string;
}

export default function BarChart({
  data,
  height = 220,
  barColor = "var(--accent)",
  barColor2 = "var(--orange)",
  showValues = true,
  label1,
  label2,
}: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm" style={{ height, color: "var(--text3)" }}>
        Veri bulunamadı
      </div>
    );
  }

  const hasSecondary = data.some((d) => d.value2 !== undefined && d.value2 > 0);
  const maxVal = Math.max(...data.map((d) => (d.value || 0) + (d.value2 || 0)), 1);
  const padding = { top: 20, bottom: 36, left: 10, right: 10 };
  const chartHeight = height - padding.top - padding.bottom;
  const barGroupWidth = 100 / data.length;
  const barWidth = Math.min(barGroupWidth * 0.6, 10);
  const gap = 1;

  return (
    <div>
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * (1 - ratio);
          return (
            <line key={ratio} x1={padding.left} x2={100 - padding.right} y1={y} y2={y}
              stroke="var(--border)" strokeWidth="0.3" strokeDasharray={ratio === 0 ? "0" : "1 1"} />
          );
        })}

        {/* Bars */}
        {data.map((item, i) => {
          const cx = padding.left + (i + 0.5) * ((100 - padding.left - padding.right) / data.length);
          const totalH = ((item.value + (item.value2 || 0)) / maxVal) * chartHeight;
          const h1 = (item.value / maxVal) * chartHeight;
          const h2 = ((item.value2 || 0) / maxVal) * chartHeight;
          const isHovered = hoveredIndex === i;

          return (
            <g key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "pointer" }}>

              {/* Hover background */}
              <rect
                x={cx - barGroupWidth / 2}
                y={padding.top}
                width={barGroupWidth}
                height={chartHeight}
                fill={isHovered ? "rgba(255,255,255,0.03)" : "transparent"}
                rx="1"
              />

              {/* Primary bar */}
              <rect
                x={hasSecondary ? cx - barWidth - gap / 2 : cx - barWidth / 2}
                y={padding.top + chartHeight - h1}
                width={barWidth}
                height={h1}
                fill={barColor}
                rx="0.8"
                opacity={isHovered ? 1 : 0.85}
                style={{ transition: "all 0.3s ease" }}
              />

              {/* Secondary bar */}
              {hasSecondary && (
                <rect
                  x={cx + gap / 2}
                  y={padding.top + chartHeight - h2}
                  width={barWidth}
                  height={h2}
                  fill={barColor2}
                  rx="0.8"
                  opacity={isHovered ? 1 : 0.85}
                  style={{ transition: "all 0.3s ease" }}
                />
              )}

              {/* Value label on hover */}
              {isHovered && showValues && (
                <text x={cx} y={padding.top + chartHeight - totalH - 4} textAnchor="middle"
                  fill="var(--text)" fontSize="3" fontWeight="600" fontFamily="var(--font-dm)">
                  {item.value}{item.value2 ? ` / ${item.value2}` : ""}
                </text>
              )}

              {/* X-axis label */}
              <text x={cx} y={height - 10} textAnchor="middle"
                fill={isHovered ? "var(--text)" : "var(--text3)"}
                fontSize="2.8" fontFamily="var(--font-dm)"
                style={{ transition: "fill 0.2s" }}>
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {hasSecondary && label1 && label2 && (
        <div className="flex items-center gap-4 mt-2 px-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: barColor }} />
            <span className="text-xs" style={{ color: "var(--text3)" }}>{label1}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: barColor2 }} />
            <span className="text-xs" style={{ color: "var(--text3)" }}>{label2}</span>
          </div>
        </div>
      )}
    </div>
  );
}
