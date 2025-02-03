import localFont from "next/font/local";

const font = localFont({
  variable: "--aspekta",
  src: [
    {
      path: "../fonts/AspektaVF.ttf",
      weight: "400 500 600 700",
    },
  ],
});

export const fontClassNames = [font.className, font.variable];
