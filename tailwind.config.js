/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          dark: '#0f0c29', 
        },
        primary: {
          DEFAULT: '#d946ef', 
          alt: '#c026d3',
        }
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}