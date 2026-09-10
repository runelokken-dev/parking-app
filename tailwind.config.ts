import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16233A", // primærtekst / mørk navy
        paper: "#F5F6F3", // bakgrunn
        surface: "#FFFFFF",
        border: "#DFE2DC",
        pine: {
          DEFAULT: "#2F6F5E", // handling / ledig
          dark: "#204E42",
          light: "#E4F0EC",
        },
        clay: {
          DEFAULT: "#B3413B", // avbestill / fare
          light: "#F6E5E3",
        },
        muted: "#8A8F86",
        booked: "#E4E5E0",
      },
      fontFamily: {
        sans: ["var(--font-public-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
