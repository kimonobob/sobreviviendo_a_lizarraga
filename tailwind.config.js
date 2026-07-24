/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Marca Alicorp — acento, nunca fondo
        brand: {
          DEFAULT: "#D6001C",
          ink: "#a80016",
          soft: "#f7d6da",
        },
        // superficies e ink via variables (swap claro/oscuro en index.css)
        surface: "var(--surface-1)",
        plane: "var(--plane)",
        ink: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        hair: "var(--border-hair)",
        grid: "var(--gridline)",
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', '"Segoe UI"', "Roboto", "sans-serif"],
      },
      borderColor: {
        DEFAULT: "var(--border-hair)",
      },
      maxWidth: {
        dash: "1600px",
      },
    },
  },
  plugins: [],
};
