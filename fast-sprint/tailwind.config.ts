import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0B",
        surface: "#121214",
        "surface-2": "#1A1A1D",
        line: "#26262A",
        muted: "#A1A1AA",
        accent: { DEFAULT: "#5689FF", soft: "rgba(86,137,255,0.12)" },
        success: "#22C55E",
        warn: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: { sans: ['"Outfit Variable"', "system-ui", "sans-serif"] },
      borderRadius: { card: "16px" },
      boxShadow: { glow: "0 0 36px rgba(86,137,255,0.38)", lift: "0 18px 40px -20px rgba(0,0,0,0.8)" },
      transitionDuration: { DEFAULT: "150ms" },
    },
  },
  plugins: [],
};
export default config;
