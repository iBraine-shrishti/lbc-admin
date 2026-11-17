/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FECD08",
          dark: "#212121",
          hover: "#E6B800",
        },
        lbc: {
          yellow: "#FECD08",
          dark: "#212121",
          gold: "#FECD08",
        },
        moto: {
          red: "#FECD08",
          yellow: "#FECD08",
          dark: "#212121",
        },
        orm: {
          gold: "#FECD08",
          "gold-premium": "#FECD08",
          dark: "#212121",
          surface: "#121212",
          "surface-light": "#1e1e1e",
          gray: "#262626",
          "gray-light": "#3f3f46",
          yellow: "#FECD08",
        },
      },
      fontFamily: {
        sans: ["Sora", "Outfit", "system-ui", "sans-serif"],
        heading: ["Rajdhani", "Outfit", "sans-serif"],
        rajdhani: ["Rajdhani", "sans-serif"],
        sora: ["Sora", "sans-serif"],
        script: ["Caveat", "cursive"],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', filter: 'blur(0px)' },
          '50%': { opacity: '0.6', filter: 'blur(1px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        fadeInUp: 'fadeInUp 0.8s ease-out forwards',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        marquee: 'marquee 20s linear infinite',
      }
    },
  },
  plugins: [],
}