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
      boxShadow: {
        soft: "0 18px 50px -24px rgba(43, 36, 36, 0.28)",
        card: "0 10px 30px -18px rgba(43, 36, 36, 0.35)",
        glow: "0 20px 60px -20px rgba(91, 59, 74, 0.45)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(60% 60% at 80% 10%, rgba(184,143,147,0.22) 0%, rgba(250,247,244,0) 70%)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        kenburns: {
          "0%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out both",
        "fadeUp-slow": "fadeUp 0.9s ease-out both",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        kenburns: "kenburns 12s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
