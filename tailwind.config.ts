import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18201b",
        field: "#f7f8f4",
        line: "#dce3d7",
        semarts: "#1f6f54",
        "semarts-dark": "#164b3c",
        "warm-gold": "#c89135"
      }
    }
  },
  plugins: []
};

export default config;
