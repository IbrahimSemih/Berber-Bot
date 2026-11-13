// İki tema: açık "Kum ve orman yeşili" ve koyu "Gece mavisi ve bakır". Web'deki
// app/globals.css (:root ve :root[data-theme="dark"]) ile aynı değerler; birini
// değiştirirseniz diğerini de güncelleyin. Tüm yazı renkleri zeminlerde en az
// 4,4:1 kontrast sağlar. Bileşenler renkleri useColors() / makeStyles() ile
// alır (src/lib/theme.tsx); sabit import yok, tema anında değişebilsin.
export const lightColors = {
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
};

export type Colors = { [K in keyof typeof lightColors]: string };

export const darkColors: Colors = {
  bg: "#18222E", // gece mavisi zemin
  bg2: "#212E3C", // kart / panel
  bg3: "#2A3847", // dolgu: pasif buton, çip
  bg4: "#33445A", // belirgin dolgu
  border: "#2E3D4D",
  border2: "#3D5066",
  text: "#F2EEE8",
  text2: "#C3CBD4",
  text3: "#A3AEBB",
  accent: "#E3A15C", // bakır: ana buton, vurgu
  accent2: "#EDB57A",
  accentDim: "rgba(227, 161, 92, 0.12)",
  accentDim2: "rgba(227, 161, 92, 0.2)",
  onAccent: "#1B1408", // bakır zemin üstündeki yazı (8:1)
  hero: "#111A24", // başlık bandı
  onHero: "#F2EEE8",
  onHero2: "#A3AEBB",
  onHeroDim: "rgba(242, 238, 232, 0.08)",
  warm: "#E3A15C",
  red: "#F2928A",
  orange: "#F0B860",
  blue: "#8FBAEA",
  green: "#86C2AE",
  redDim: "#3A2428",
  redBorder: "rgba(242, 146, 138, 0.3)",
  orangeDim: "#3A3020",
  greenDim: "#1C3530",
  overlay: "rgba(0, 0, 0, 0.6)",
  switchTrackOn: "#8A6238",
  switchTrackOff: "#3D5066",
  switchThumbOn: "#E3A15C",
  switchThumbOff: "#C3CBD4",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
