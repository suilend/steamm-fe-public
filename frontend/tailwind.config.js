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

      "jordy-blue": "hsl(var(--jordy-blue))",
      "rich-black": "hsl(var(--rich-black))",
      emerald: "hsl(var(--emerald))",
      "rich-black-light": "hsl(var(--rich-black-light))",
      "medium-slate-blue": "hsl(var(--medium-slate-blue))",
      white: "hsl(var(--white))",
    },
    borderRadius: {},
    boxShadow: {},
  },
  plugins: [require("tailwindcss-animate")],
};
