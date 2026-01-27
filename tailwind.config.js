/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1e3a8a',
        slate: {
          DEFAULT: '#475569',
          light: '#cbd5e1',
          dark: '#334155',
        },
      },
    },
  },
  plugins: [],
}
