import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Caerora brand palette
        ivory: "#FAF7F4",
        rose: "#B88F93",
        taupe: "#8D7470",
        espresso: "#2B2424",
        champagne: "#D8C3A5",
        plum: "#5B3B4A",
        sage: "#A8B6A1",
        terracotta: "#B9745A",
        cream: "#F3ECE6",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        wider: "0.12em",
        widest: "0.28em",
      },
      maxWidth: {
        content: "1200px",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
