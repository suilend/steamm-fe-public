/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ["var(--font-aspekta)"],
    },
    fontSize: {
      h1: ["28px"],
      h2: ["24px"],
      h3: ["20px"],
      p1: ["16px"],
      p2: ["14px"],
      p3: ["12px"],
    },
    colors: {
      foreground: "hsl(var(--foreground))",
      background: "hsl(var(--background))",

      "jordy-blue": "hsl(var(--jordy-blue))",
      "rich-black": "hsl(var(--rich-black))",
      emerald: "hsl(var(--emerald))",
      "rich-black-light": "hsl(var(--rich-black-light))",
      "medium-slate-blue": "hsl(var(--medium-slate-blue))",

      "primary-foreground": "hsl(var(--primary-foreground))",
      "secondary-foreground": "hsl(var(--secondary-foreground))",
      "tertiary-foreground": "hsl(var(--tertiary-foreground))",
      "button-foreground": "hsl(var(--button-foreground))",

      primary: "hsl(var(--primary))",
      secondary: "hsl(var(--secondary))",
      tertiary: "hsl(var(--tertiary))",

      button: "hsl(var(--button))",
      "button-hover": "hsl(var(--button-hover))",
      "button-active": "hsl(var(--button-active))",
      "button-disabled": "hsl(var(--button-disabled))",

      popover: "hsl(var(--popover))",
      border: "hsl(var(--border))",

      success: "hsl(var(--success))",
      error: "hsl(var(--error))",

      "a1-default": "hsl(var(--a1-default))",
      "a1-active": "hsl(var(--a1-active))",
      "a1-disabled": "hsl(var(--a1-disabled))",

      "a2-default": "hsl(var(--a2-default))",
      "a2-active": "hsl(var(--a2-active))",
      "a2-disabled": "hsl(var(--a2-disabled))",

      "a3-default": "hsl(var(--a3-default))",
      "a3-active": "hsl(var(--a3-active))",
      "a3-disabled": "hsl(var(--a3-disabled))",

      "a4-default": "hsl(var(--a4-default))",
      "a4-active": "hsl(var(--a4-active))",
      "a4-disabled": "hsl(var(--a4-disabled))",

      "a5-default": "hsl(var(--a5-default))",
      "a5-active": "hsl(var(--a5-active))",
      "a5-disabled": "hsl(var(--a5-disabled))",
    },
    borderRadius: {
      sm: "4px",
      md: "8px",
      lg: "12px",
    },
  },
  plugins: [require("tailwindcss-animate")],
};
