// Palet: "Krem ve orman yeşili" (açık tema). Web'deki app/globals.css ile aynı
// değerler; birini değiştirirseniz diğerini de güncelleyin. Tüm yazı renkleri
// zemin tonlarında en az 4,5:1 kontrast sağlar.
export const colors = {
  bg: "#FAF7F2", // sayfa zemini (sıcak krem)
  bg2: "#FFFFFF", // kart / panel
  bg3: "#F3EEE6", // hafif dolgu: pasif buton, çip
  bg4: "#E9E2D6", // belirgin dolgu / pasif anahtar
  border: "#E5DED2",
  border2: "#D6CCBD",
  text: "#1F2421",
  text2: "#565B55",
  text3: "#656A63",
  accent: "#2F6B4F", // orman yeşili: ana buton, vurgu
  accent2: "#285C44", // basılı / anahtar izi
  accentDim: "rgba(47, 107, 79, 0.08)",
  accentDim2: "rgba(47, 107, 79, 0.14)",
  onAccent: "#FFFFFF",
  warm: "#C9813A", // ikincil sıcak vurgu (dekoratif)
  red: "#B93C34",
  orange: "#995709",
  blue: "#2A65A0",
  green: "#2B7553",
  redDim: "#FBEAE8",
  redBorder: "rgba(185, 60, 52, 0.3)",
  orangeDim: "#FBF0DE",
  greenDim: "#E6F2EC",
  overlay: "rgba(31, 36, 33, 0.45)",
  // Anahtar (Switch): açıkken açık yeşil iz + koyu yeşil topuz, kapalıyken bej iz + beyaz topuz
  switchTrackOn: "#9FC5AF",
  switchTrackOff: "#968B7A",
  switchThumbOn: "#2F6B4F",
  switchThumbOff: "#FFFFFF",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
