/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,jsx}",
    "./admin/**/*.{js,jsx}",
    "./auth/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./officer/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        "ga-blue": "#185FA5",
        "ga-green": "#0F6E56",
        "ga-ink": "#2C2C2A",
        "ga-muted": "#888780",
        "ga-body": "#5F5E5A",
        "ga-border": "#E8E6DF",
        "ga-cream": "#F7F5EF",
        "ga-surface": "#F1EFE8",
        "ga-line": "#D3D1C7",
        "ga-faint": "#B4B2A9",
        "ga-error": "#A32D2D",
        "ga-purple": "#533AB7",
        "ga-amber": "#854F0B",
      },
      fontFamily: {
        serif: ["Georgia", "'Times New Roman'", "serif"],
        sans: ["'DM Sans'", "'Segoe UI'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
