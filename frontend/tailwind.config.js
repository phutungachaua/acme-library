/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./contexts/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { ink: "#163c35", paper: "#f5f4ef", amberwood: "#c66a2b" },
      boxShadow: {
        soft: "0 16px 40px rgba(22, 60, 53, .08)",
        card: "0 1px 2px rgba(15, 23, 42, .04), 0 12px 30px rgba(15, 23, 42, .07)",
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "Arial", "sans-serif"],
        serif: ["var(--font-roboto)", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
