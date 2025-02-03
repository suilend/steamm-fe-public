/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ["var(--font-aspekta)"],
    },
    fontSize: {},
    colors: {
      foreground: "hsl(var(--foreground))",
      background: "hsl(var(--background))",
    },
    borderRadius: {},
    boxShadow: {},
  },
  plugins: [require("tailwindcss-animate")],
};
