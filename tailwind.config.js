/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom service colors for accessibility
        healthcare: {
          DEFAULT: "#ef4444",
          light: "#fecaca",
          dark: "#991b1b",
        },
        emergency: {
          DEFAULT: "#f97316",
          light: "#fed7aa",
          dark: "#9a3412",
        },
        legal: {
          DEFAULT: "#8b5cf6",
          light: "#ddd6fe",
          dark: "#5b21b6",
        },
        government: {
          DEFAULT: "#3b82f6",
          light: "#bfdbfe",
          dark: "#1d4ed8",
        },
        employment: {
          DEFAULT: "#22c55e",
          light: "#bbf7d0",
          dark: "#15803d",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        "voice-wave": {
          "0%, 100%": { height: "8px" },
          "50%": { height: "32px" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "voice-wave": "voice-wave 1s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
      },
      fontSize: {
        // Extra large fonts for elderly users
        "2xs": "0.625rem",
        accessibility: "1.25rem",
        "accessibility-lg": "1.5rem",
        "accessibility-xl": "2rem",
        "accessibility-2xl": "2.5rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
