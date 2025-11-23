/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',
          slate: '#1f2937',
          copper: '#b8794a',
          copperDark: '#8a5a35',
          sand: '#f5f6f8',
          mist: '#e6e8ec',
          steel: '#5b6474',
          teal: '#4f7c77',
          tealDark: '#3a5f5a',
        },
      },
    },
  },
  plugins: [],
}
