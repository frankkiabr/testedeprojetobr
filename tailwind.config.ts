import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#ffffff",
        canvas: { DEFAULT: "#f3f5f9", deep: "#e7ebf2" },
        ink: "#0f1a33",
        muted: "#5f6b80",
        subtle: "#98a2b3",
        line: { DEFAULT: "#e8ebf1", strong: "#d5dae3" },
        accent: { DEFAULT: "#2f5bea", deep: "#1d3fb8", soft: "#e8eeff" },
        verified: { DEFAULT: "#2fae5c", soft: "#e8f6ee" },
      },
      fontFamily: {
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', '"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        float: "0 .75rem 2.5rem -.5rem #00000040",
        soft: "0 .375rem 1rem #0000001f",
        lift: "0 1.75rem 3.5rem -1.5rem #0000004d",
        pill: "0 .1875rem .75rem #0000001a, 0 0 0 1px #0000000a",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(.22, 1, .36, 1)",
      },
      keyframes: {
        marquee: { to: { transform: "translate(-50%)" } },
        scan: { "0%": { top: "22%" }, to: { top: "74%" } },
        blink: { "0%,49%": { opacity: "1" }, "50%,100%": { opacity: "0" } },
      },
      animation: {
        marquee: "marquee 60s linear infinite",
        scan: "scan 1.2s ease-in-out infinite alternate",
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
