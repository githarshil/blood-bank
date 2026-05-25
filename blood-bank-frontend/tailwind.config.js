/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#ef4444',
          DEFAULT: '#b91c1c',
          dark: '#991b1b',
        }
      }
    },
  },
  plugins: [],
}
