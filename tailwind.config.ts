import type { Config } from "tailwindcss";

/**
 * LUMEN design tokens.
 * Primary green #39FF88 on a near-black #0A0A0A canvas.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lumen: {
          DEFAULT: "#39FF88",
          // Derived shades so we get hover/pressed states without guessing hex codes at call sites.
          dim: "#2EDB70",
          deep: "#1FA855",
          glow: "rgba(57, 255, 136, 0.35)",
        },
        canvas: {
          DEFAULT: "#0A0A0A",
          elevated: "#121212",
          border: "rgba(255, 255, 255, 0.10)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        // iOS-native feel: generous radii.
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      backdropBlur: {
        glass: "20px",
      },
      boxShadow: {
        glow: "0 0 24px rgba(57, 255, 136, 0.25)",
        card: "0 8px 32px rgba(0, 0, 0, 0.45)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-in-up": "fade-in-up 0.35s ease-out both",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
      },
      // Safe-area aware spacing for iPhone notch + home indicator.
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};

export default config;
