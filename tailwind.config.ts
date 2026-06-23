import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#C9A84C",
          50:  "#FBF6E9",
          100: "#F5EDD0",
          200: "#EBDAA1",
          300: "#DEC672",
          400: "#D4B455",
          500: "#C9A84C",
          600: "#A98A35",
          700: "#836B28",
          800: "#5C4A1B",
          900: "#3A2F11",
        },
        dark:    "#0D0B08",
        charcoal:"#1C1916",
        cream:   "#FAFAF5",
        ivory:   "#F4EFE6",
        taupe:   "#7A6E60",
        border:  "#E5DDD3",
        warm:    "#2C2620",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      animation: {
        "slide-in":   "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in":    "fadeIn 0.4s ease-out",
        "fade-up":    "fadeUp 0.5s ease-out both",
        "pulse-dot":  "pulseDot 1.4s ease-in-out infinite",
        "rule-grow":  "ruleGrow 0.6s ease-out both",
        "shimmer":    "shimmer 2s ease-in-out infinite",
      },
      keyframes: {
        slideIn: {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%":            { transform: "scale(1)",   opacity: "1" },
        },
        ruleGrow: {
          from: { transform: "scaleX(0)", transformOrigin: "left" },
          to:   { transform: "scaleX(1)", transformOrigin: "left" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
