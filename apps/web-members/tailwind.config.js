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
          dark: '#0f1f2a',
          copper: '#1f6f78',
          copperDark: '#0f4f56',
          sand: '#f2f4f5',
          mist: '#e4eaed',
          steel: '#5f6b73',
        },
      },
    },
  },
  plugins: [],
}
