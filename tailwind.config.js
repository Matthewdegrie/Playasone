// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#68FE9A",
          navy: "#16264E",
          slate: "#495573",
          paper: "#F0F4FA",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "Arial", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "Arial", "sans-serif"],
      },
      boxShadow: {
        "inset-brand": "inset 0 0 0 1px rgba(104,254,154,0.6)",
      },
    },
  },
  plugins: [],
};