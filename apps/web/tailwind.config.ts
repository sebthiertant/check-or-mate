import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        bg:      "var(--bg)",
        panel:   "var(--panel)",
        panel2:  "var(--panel-2)",
        panel3:  "var(--panel-3)",
        border:  "var(--border)",
        accent:  "var(--accent)",
      },
      animation: {
        "bar-fill": "bar-fill 0.6s ease-out forwards",
        "fs-enter": "fs-enter 0.2s ease-out forwards",
      },
      keyframes: {
        "bar-fill": {
          from: { width: "0%" },
          to:   { width: "var(--bar-width)" },
        },
        "fs-enter": {
          from: { opacity: "0", transform: "scale(0.98)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
