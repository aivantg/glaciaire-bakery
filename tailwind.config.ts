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
        bakery: {
          50: "#fdf8f0",
          100: "#faefd8",
          200: "#f4daa8",
          300: "#ecc070",
          400: "#e4a040",
          500: "#d4821c",
          600: "#b96614",
          700: "#994f13",
          800: "#7c4016",
          900: "#663617",
        },
      },
    },
  },
  plugins: [],
};
export default config;
