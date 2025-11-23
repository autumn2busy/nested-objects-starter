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
          // Metropolitan Fintech palette
          dark: '#343A40',
          slate: '#474747',
          copper: '#2A7166',
          copperDark: '#225C53',
          sand: '#FAFAFA',
          mist: '#FFFFFF',
          steel: '#A9A9A9',
          teal: '#2A7166',
          tealDark: '#1E5249',
        },
      },
      boxShadow: {
        'brand-card': '0 18px 48px rgba(52, 58, 64, 0.12)',
        'brand-soft': '0 10px 30px rgba(42, 113, 102, 0.16)',
      },
    },
  },
  plugins: [],
}
