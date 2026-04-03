/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        accent: "#34D399",
        danger: "#EF4444",
        surface: "#141D2B",
        "surface-card": "#1A2535",
        "surface-elevated": "#1E293B",
        muted: "#5A6A85",
        background: "#0F1724",
      },
    },
  },
  plugins: [],
};
