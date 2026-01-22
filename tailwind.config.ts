import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: "#2D3E29", // primary text / headlines (warmer olive-green)
        ink: "#1C2619", // deep contrast option (warmer dark green)
        sage: "#7D8F70", // accent (warmer olive-sage)
        eucalyptus: "#9CBF90", // soft accent (warmer yellow-green)
        muted: "#5C6555", // body text (warmer muted green)
        paper: "#F8FAF5", // surface paper (slightly warmer)
        wash: "#F2F5E9", // background wash (warmer yellow-green tint)
        soft: "#EDF2E5", // subtle fills (warmer light green)
        line: "#D2D9C9", // dividers (warmer green-gray)
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-serif", "serif"],
        serif: ["var(--font-display)", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
