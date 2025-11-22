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
          dark: '#0b0f14',
          slate: '#1c252f',
          copper: '#f97316',
          copperDark: '#c2410c',
          sand: '#f8fafc',
          mist: '#e5e7eb',
          steel: '#6b7280',
          teal: '#1abc9c',
          tealDark: '#0f766e',
        },
      },
    },
  },
  plugins: [],
}
