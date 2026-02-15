/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        darkBlue: "#101922",
        secondary: "#8B5CF6",
        accent: "#F59E0B",
      },
    },
  },
  plugins: [],
};
