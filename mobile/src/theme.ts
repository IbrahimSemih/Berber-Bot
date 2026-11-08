// Web panelindeki app/globals.css değişkenlerinin karşılığı (koyu tema).
export const colors = {
  bg: "#0a0a0a",
  bg2: "#111111",
  bg3: "#1a1a1a",
  bg4: "#222222",
  border: "#2a2a2a",
  border2: "#333333",
  text: "#f0ede8",
  text2: "#9a9690",
  text3: "#5a5752",
  accent: "#c8f060",
  accent2: "#a8d040",
  accentDim: "rgba(200, 240, 96, 0.08)",
  accentDim2: "rgba(200, 240, 96, 0.15)",
  onAccent: "#0a0a0a",
  red: "#ff5f57",
  orange: "#ffaa33",
  blue: "#4a9eff",
  green: "#4caf7d",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
