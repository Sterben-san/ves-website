import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ves: {
          ink: "#111513",
          deep: "#0e1f21",
          black: "#080b0a",
          leaf: "#397665",
          lime: "#f2c94c",
          clay: "#8d7142",
          mist: "#f2f0e9",
          cream: "#ffffff",
          field: "#f8f7f1",
          paper: "#f2f0e9",
          text: "#17211d",
          solar: "#f2c94c"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(8, 11, 10, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
