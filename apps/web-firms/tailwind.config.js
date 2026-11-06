/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { brand: { DEFAULT: '#2A7166', dark: '#343A40', deeper: '#070d1b', light: '#edf5f3', accent: '#34d399', sand: '#FAFAFA', steel: '#5B646A' } },
    fontFamily: { sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'] },
  } },
  plugins: [],
}
