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
          dark: '#1f2a33',
          copper: '#c47b4f',
          copperDark: '#a26232',
          sand: '#f4ede3',
          mist: '#e9e3da',
          steel: '#7d838c',
        },
      },
    },
  },
  plugins: [],
}
