import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: "#1A2B23",
        forestDeep: "#122019",
        sand: "#EDE6D6",
        charcoal: "#111111",
        amber: "#C9A86A",
        amberDark: "#A9884E",
        paper: "#F8F7F2",
        muted: "#686B65",
        border: "#DCDDD5",
        success: "#286548",
        warning: "#8A5B19",
        error: "#A43C32",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "76rem",
        wide: "88rem",
      },
      borderRadius: {
        sm: "3px",
        md: "6px",
        lg: "10px",
      },
      spacing: {
        section: "5.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
