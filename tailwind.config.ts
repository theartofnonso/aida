import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#2B0A3D",
          soft: "#3D1A52",
          tint: "#F2EDF6",
        },
        canvas: "#FAF8F5",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#1A1626",
          muted: "#6B6577",
          soft: "#9B95A8",
        },
        line: "#ECE7E1",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        serif: [
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,22,38,0.04), 0 8px 24px rgba(26,22,38,0.06)",
        soft: "0 1px 2px rgba(26,22,38,0.04)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "dot-bounce": "dotBounce 1.2s infinite ease-in-out",
        "progress-grow": "progressGrow 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        dotBounce: {
          "0%, 80%, 100%": { opacity: "0.25", transform: "translateY(0)" },
          "40%": { opacity: "1", transform: "translateY(-2px)" },
        },
        progressGrow: {
          "0%": { transform: "scaleX(0.85)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
