/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // <-- Tailwind scans these files
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Lexend", "sans-serif"],
        lexend: ["Lexend", "sans-serif"], // your custom font
      },
    },
  },
  plugins: [],
};
