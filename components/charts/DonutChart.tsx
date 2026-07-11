"use client";
import { useState } from "react";

interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

export default function DonutChart({
  data,
  size = 180,
  strokeWidth = 28,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm" style={{ width: size, height: size, color: "var(--text3)" }}>
        Veri yok
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-sm" style={{ width: size, height: size, color: "var(--text3)" }}>
        Veri yok
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const dashLength = pct * circumference;
    const dashGap = circumference - dashLength;
    const offset = -(accumulated * circumference) + circumference * 0.25; // Start from top
    accumulated += pct;
    return { ...d, pct, dashLength, dashGap, offset, index: i };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Donut SVG */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke="var(--bg3)" strokeWidth={strokeWidth} />

          {/* Segments */}
          {segments.map((seg) => (
            <circle
              key={seg.index}
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredIndex === seg.index ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${seg.dashLength} ${seg.dashGap}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
              opacity={hoveredIndex !== null && hoveredIndex !== seg.index ? 0.4 : 1}
              onMouseEnter={() => setHoveredIndex(seg.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ transition: "all 0.3s ease", cursor: "pointer" }}
            />
          ))}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hoveredIndex !== null ? (
            <>
              <span className="font-syne font-black text-xl" style={{ color: "var(--text)" }}>
                {Math.round(segments[hoveredIndex].pct * 100)}%
              </span>
              <span className="text-xs mt-0.5 max-w-[80px] text-center truncate" style={{ color: "var(--text3)" }}>
                {segments[hoveredIndex].label}
              </span>
            </>
          ) : (
            <>
              {centerValue && (
                <span className="font-syne font-black text-xl" style={{ color: "var(--text)" }}>
                  {centerValue}
                </span>
              )}
              {centerLabel && (
                <span className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                  {centerLabel}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-0">
        {segments.map((seg) => (
          <div
            key={seg.index}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              background: hoveredIndex === seg.index ? "var(--bg3)" : "transparent",
            }}
            onMouseEnter={() => setHoveredIndex(seg.index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-sm truncate" style={{ color: "var(--text2)" }}>{seg.label}</span>
            <span className="text-xs font-medium ml-auto flex-shrink-0" style={{ color: "var(--text3)" }}>
              {Math.round(seg.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
