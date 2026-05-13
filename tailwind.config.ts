import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft lilac background palette (from the passion-fruit poster)
        lilac: {
          50: "#f5f0fa",
          100: "#ece1f3", // page background
          200: "#e0d2eb",
          300: "#cdb8de",
          400: "#a87dec",
          500: "#8e6bd9",
          700: "#5f3fa6",
        },
        // Near-black for primary type, like the poster
        ink: {
          900: "#0a0a0a",
          800: "#1a1a1a",
          600: "#3a2f4a",
          400: "#6b5f7a",
          300: "#8a7d9a",
        },
        // Pink (script accent + status)
        bakery: {
          300: "#ff97c1",
          400: "#ff6ba6",
          500: "#e94e89",
          600: "#c8377a",
        },
        sunny: {
          300: "#ffe27a",
          500: "#f2c14e",
          700: "#c89327",
        },
        leaf: {
          300: "#a6e9c5",
          500: "#5fa472",
          700: "#3d7348",
        },
        sky: {
          300: "#9fc4f5",
          500: "#2e7acc",
          700: "#1f5694",
        },
        cream: {
          100: "#fdfdee",
        },
        // Per-item ink palette for colored menu names
        item: {
          brown: "#5a3a1a",
          orange: "#d97a3a",
          rose: "#e94e89",
          pink: "#ff8fb3",
          coral: "#e85a3a",
          yellow: "#e09d28",
          mustard: "#a87827",
          purple: "#7a4dc7",
          green: "#3d7348",
        },
      },
      fontFamily: {
        // Heavy editorial display (stacked hero) — Archivo Black is single-weight 900
        display: ["'Archivo Black'", "'Inter'", "system-ui", "sans-serif"],
        // Primary body / UI — Inter, all weights
        sans: ["'Inter'", "system-ui", "sans-serif"],
        // Tiny mono accents (order ids etc.)
        mono: [
          "'DM Mono'",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        script: ["'Caveat'", "cursive"],
      },
      keyframes: {
        slideInDown: {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        newBadgePulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        slideInDown: "slideInDown 0.4s ease-out",
        newBadgePulse: "newBadgePulse 1s ease-in-out 3",
      },
    },
  },
  plugins: [],
};
export default config;
