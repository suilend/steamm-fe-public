/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    fontFamily: { sans: ["var(--font-aspekta)"] },
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
      primary: "hsl(var(--primary))",
      "secondary-foreground": "hsl(var(--secondary-foreground))",
      secondary: "hsl(var(--secondary))",
      "tertiary-foreground": "hsl(var(--tertiary-foreground))",
      tertiary: "hsl(var(--tertiary))",

      "button-1-foreground": "hsl(var(--button-1-foreground))",
      "button-1": "hsl(var(--button-1))",
      "button-2-foreground": "hsl(var(--button-2-foreground))",
      "button-2": "hsl(var(--button-2))",

      selected: "hsl(var(--selected))",

      border: "hsl(var(--border))",
      "hover-border": "hsl(var(--hover-border))",

      focus: "hsl(var(--focus))",
      card: "hsl(var(--card))",
      popover: "hsl(var(--popover))",
      tooltip: "hsl(var(--tooltip))",

      success: "hsl(var(--success))",
      verified: "hsl(var(--verified))",
      warning: "hsl(var(--warning))",
      error: "hsl(var(--error))",

      gold: "hsl(var(--gold))",
      silver: "hsl(var(--silver))",
      bronze: "hsl(var(--bronze))",
    },
    borderRadius: {
      sm: "4px",
      md: "8px",
      lg: "12px",
      full: "calc(infinity * 1px)",
    },
    extend: {
      animation: {
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
