/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{html,tsx,js}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      colors: {
        bg: "#0a0a1e",
        card: "#1a1a2e",
        border: "#2d2d44",
        fg: "#e8e8f0",
        muted: "#6b6b80",
        accent: "#bd93f9",
        accent2: "#8b5cf6",
        primary: "#a855f7",
        secondary: "#3b82f6",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        glass: "rgba(17, 23, 32, 0.7)",
        glow: "rgba(189, 147, 249, 0.4)",
      },
    },
  },
  plugins: [],
}