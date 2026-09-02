/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/client/**/*.{js,ts,jsx,tsx,html}",
    "./public/**/*.html",
    "./index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        trmnl: {
          bg: '#F5F5F0',
          paper: '#FFFFFF',
          ink: '#111111',
          accent: '#E63946',
          border: '#D1D1CB',
          subtle: '#666666'
        }
      },
      fontFamily: {
        mono: ['Courier New', 'Courier', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
