/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Figtree', 'sans-serif'],
      },
      colors: {
        reg: '#2563EB',
        ot: '#DB2777',
        surface: '#F1F5F9',
        ink: '#0F172A',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(15,23,42,0.08), 0 1px 0 rgba(255,255,255,0.6) inset',
        bento: '0 2px 12px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04)',
        'bento-lg': '0 8px 32px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)',
        reg: '0 8px 24px rgba(37,99,235,0.30)',
        ot: '0 8px 24px rgba(219,39,119,0.30)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
