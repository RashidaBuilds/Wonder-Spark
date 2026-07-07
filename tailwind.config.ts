import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      colors: {
        ink: "#0b0a12",
        panel: "#14131c",
        ivory: "#f4f2fa",
        muted: "#a6a2b5",
        lavender: "#c9b8f2",
        champagne: "#ead8b0",
        powder: "#a9c7e8",
      },
      animation: {
        "orb-breathe": "orb-breathe 5.5s ease-in-out infinite",
        "core-pulse": "core-pulse 2.4s ease-in-out infinite",
        "particle-drift": "particle-drift 7s ease-in-out infinite",
        "ring-spin": "ring-spin 18s linear infinite",
        "float-soft": "float-soft 6s ease-in-out infinite",
        "fade-up": "fade-up 420ms ease-out both",
      },
      keyframes: {
        "orb-breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.94" },
          "50%": { transform: "scale(1.035)", opacity: "1" },
        },
        "core-pulse": {
          "0%, 100%": { transform: "scale(0.92)", opacity: "0.78" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
        "particle-drift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0)", opacity: "0.62" },
          "50%": { transform: "translate3d(10px, -14px, 0)", opacity: "1" },
        },
        "ring-spin": {
          to: { transform: "rotate(360deg)" },
        },
        "float-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
