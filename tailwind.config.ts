import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        dm: ["var(--font-dm)", "sans-serif"],
      },
      // Renkler app/globals.css değişkenlerinden gelir (tek kaynak)
      colors: {
        bg: {
          DEFAULT: "var(--bg)",
          2: "var(--bg2)",
          3: "var(--bg3)",
          4: "var(--bg4)",
        },
        border: {
          DEFAULT: "var(--border)",
          2: "var(--border2)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          2: "var(--accent2)",
          dim: "var(--accent-dim)",
          dim2: "var(--accent-dim2)",
          on: "var(--on-accent)",
        },
        txt: {
          DEFAULT: "var(--text)",
          2: "var(--text2)",
          3: "var(--text3)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
