import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "menu-in": {
          "0%": { opacity: "0", transform: "translateY(-6px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "menu-out": {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-6px) scale(0.95)" },
        },
        "backdrop-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "menu-in": "menu-in 160ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "menu-out": "menu-out 120ms cubic-bezier(0.4, 0, 1, 1) forwards",
        "backdrop-in": "backdrop-in 160ms ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
