// Palet: "Kum ve orman yeşili" (açık tema). Web'deki app/globals.css ile aynı
// değerler; birini değiştirirseniz diğerini de güncelleyin. Tüm yazı renkleri
// zemin tonlarında en az 4,5:1 kontrast sağlar.
export const colors = {
  bg: "#EDE5D8", // sayfa zemini (sıcak kum)
  bg2: "#FBF7F0", // kart / panel (kırık beyaz)
  bg3: "#F2EBDF", // hafif dolgu: pasif buton, çip
  bg4: "#E4D9C7", // belirgin dolgu / pasif anahtar
  border: "#DDD1BE",
  border2: "#CDBFA8",
  text: "#1F2421",
  text2: "#525750",
  text3: "#5A5F58",
  accent: "#2F6B4F", // orman yeşili: ana buton, vurgu
  accent2: "#285C44", // basılı / anahtar izi
  accentDim: "rgba(47, 107, 79, 0.08)",
  accentDim2: "rgba(47, 107, 79, 0.14)",
  onAccent: "#FFFFFF",
  hero: "#2F6B4F", // yeşil başlık bandı
  onHero: "#FAF7F2", // yeşil zemin üstündeki yazı
  onHero2: "#CFE3D6", // yeşil zemin üstündeki ikincil yazı
  onHeroDim: "rgba(250, 247, 242, 0.14)", // yeşil zemin üstünde buton dolgusu
  warm: "#C9813A", // ikincil sıcak vurgu (dekoratif)
  red: "#AD3730",
  orange: "#925307",
  blue: "#2A65A0",
  green: "#286E4E",
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
