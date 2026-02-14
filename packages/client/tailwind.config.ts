import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sao: {
          blue: "#4fc3f7",
          gold: "#ffd54f",
          red: "#ef5350",
          green: "#66bb6a",
          dark: "#0a0a0a",
          panel: "rgba(10, 20, 40, 0.85)",
        },
      },
      fontFamily: {
        game: ["Rajdhani", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config
