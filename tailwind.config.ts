import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255,255,255,0.06)"
      },
      backdropBlur: {
        xs: "2px"
      },
      boxShadow: {
        glass: "0 10px 30px rgba(0,0,0,0.25)"
      }
    }
  },
  plugins: []
} satisfies Config;
