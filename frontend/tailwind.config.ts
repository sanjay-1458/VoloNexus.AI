import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "mf-bg": "#0B0F1A",
        "mf-bg-secondary": "#111827",
        "mf-accent": "#3B82F6",
        "mf-accent-light": "#60A5FA",
        "mf-accent-hover": "#2563EB",
        "mf-text": "#FFFFFF",
        "mf-text-secondary": "#9CA3AF",
        "mf-border": "#1F2937",
        "mf-card": "#111827",
        "mf-success": "#10B981",
        "mf-warning": "#F59E0B",
        "mf-danger": "#EF4444",
      },
      backgroundImage: {
        "mf-gradient": "linear-gradient(135deg, #0B0F1A 100%, #0B0F1A 100%)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      backdropBlur: {
        nav: "10px",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
