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
        surface: {
          base: '#FFFFFF',
          muted: '#FAFAFA',
          subtle: '#F6F6F6',
        },
        text: {
          primary: '#343A40',
          secondary: '#474747',
          muted: '#5B646A',
        },
        border: {
          subtle: '#E5E7EB',
          strong: '#CBD5E1',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        gutter: '1.25rem',
        card: '1.5rem',
        section: '3.5rem',
      },
      boxShadow: {
        'brand-card': '0 18px 48px rgba(52, 58, 64, 0.12)',
        'brand-soft': '0 10px 30px rgba(42, 113, 102, 0.16)',
      },
    },
  },
  plugins: [],
}
