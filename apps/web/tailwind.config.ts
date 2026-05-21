import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "JetBrains Mono", "monospace"],
      },
      animation: {
        "bar-fill": "bar-fill 0.6s ease-out forwards",
      },
      keyframes: {
        "bar-fill": {
          from: { width: "0%" },
          to: { width: "var(--bar-width)" },
        },
      },
    },
  },
  plugins: [],
}

export default config
