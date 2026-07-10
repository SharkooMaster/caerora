import type { Config } from "tailwindcss";

// Caerora — "Life in the Spirit" palette, drawn from the season brand boards:
// midnight navy, parchment ivory, antique gold, stone, olive and a restrained
// crimson. Legacy token names (rose, plum, espresso, …) are kept as aliases so
// every existing component reskins automatically.
const palette = {
  parchment: "#F6F3EC", // page background
  cream: "#EDE7DA", // alt section background
  midnight: "#0B1326", // primary text / dark UI
  navy: "#16264A", // deep accent (bands, buttons hover)
  stone: "#716D62", // muted text
  gold: "#A5813E", // accent text / eyebrows (readable on parchment)
  goldLight: "#D4AF37", // highlight gold on dark backgrounds
  sand: "#CDB99A", // warm neutral
  olive: "#7C8465", // sage-olive (success, foliage)
  crimson: "#96342B", // errors / sale
};

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // New canonical names
        parchment: palette.parchment,
        midnight: palette.midnight,
        navy: palette.navy,
        stone: palette.stone,
        gold: palette.gold,
        goldlight: palette.goldLight,
        sand: palette.sand,
        olive: palette.olive,
        crimson: palette.crimson,
        // Legacy aliases (existing components keep working, restyled)
        ivory: palette.parchment,
        cream: palette.cream,
        espresso: palette.midnight,
        plum: palette.navy,
        taupe: palette.stone,
        rose: palette.gold,
        champagne: palette.goldLight,
        sage: palette.olive,
        terracotta: palette.crimson,
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
        soft: "0 18px 50px -24px rgba(11, 19, 38, 0.30)",
        card: "0 10px 30px -18px rgba(11, 19, 38, 0.35)",
        glow: "0 20px 60px -20px rgba(22, 38, 74, 0.45)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(60% 60% at 80% 10%, rgba(212,175,55,0.14) 0%, rgba(246,243,236,0) 70%)",
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
        twinkle: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out both",
        "fadeUp-slow": "fadeUp 0.9s ease-out both",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        kenburns: "kenburns 12s ease-out both",
        twinkle: "twinkle 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
