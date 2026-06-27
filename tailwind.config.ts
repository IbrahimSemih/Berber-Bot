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
      colors: {
        bg: {
          DEFAULT: "#0a0a0a",
          2: "#111111",
          3: "#1a1a1a",
          4: "#222222",
        },
        border: {
          DEFAULT: "#2a2a2a",
          2: "#333333",
        },
        accent: {
          DEFAULT: "#c8f060",
          2: "#a8d040",
          dim: "rgba(200,240,96,0.08)",
          dim2: "rgba(200,240,96,0.15)",
        },
        txt: {
          DEFAULT: "#f0ede8",
          2: "#9a9690",
          3: "#5a5752",
        },
      },
    },
  },
  plugins: [],
};
export default config;
