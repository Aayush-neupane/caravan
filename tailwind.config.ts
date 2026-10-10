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
        amberInk: "#7A5F2E",
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
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      fontSize: {
        "display-xl": ["3.2rem", { lineHeight: "1" }],
        "display-lg": ["2.8rem", { lineHeight: "1.05" }],
        "display-md": ["2.6rem", { lineHeight: "1.04" }],
      },
      maxWidth: {
        content: "var(--content-max,76rem)",
        wide: "var(--wide-max,88rem)",
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
