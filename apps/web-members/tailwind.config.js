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
          primary: '#2A7166',
          primaryDark: '#1E5249',
          accent: '#C27F2C',
          accentDark: '#9F611E',
          surface: '#FFFFFF',
          background: '#F6F6F6',
          soft: '#F1F4F3',
          border: '#D6E2DE',
          muted: '#5D6B67',
          text: '#24302D',
          heading: '#1B2624',
          highlight: '#E8F2EF',
          overlay: '#10201C',
          copper: '#2A7166',
          copperDark: '#225C53',
          sand: '#FAFAFA',
          mist: '#FFFFFF',
          steel: '#A9A9A9',
          slate: '#474747',
          dark: '#343A40',
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
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'brand-card': '0 18px 48px rgba(52, 58, 64, 0.12)',
        'brand-soft': '0 10px 30px rgba(42, 113, 102, 0.16)',
        'brand-strong': '0 14px 45px rgba(16, 32, 28, 0.16)',
        'brand-inner': 'inset 0 1px 2px rgba(16, 32, 28, 0.08)',
      },
      spacing: {
        gutter: '1.25rem',
        section: '3.5rem',
        'section-lg': '4.5rem',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
