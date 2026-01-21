import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: "#1F3D2B", // primary text / headlines
        ink: "#102018", // deep contrast option
        sage: "#6F8E7C", // accent
        eucalyptus: "#8FBFA3", // soft accent
        muted: "#4D6457", // body text
        paper: "#F6FAF5", // surface paper
        wash: "#EDF4EA", // background wash
        soft: "#E8F1EB", // subtle fills
        line: "#C9D8CC", // dividers
      },
    },
  },
  plugins: [],
};

export default config;
