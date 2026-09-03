/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef7ff', 100: '#d9ecff', 200: '#bcdfff', 300: '#8ecbff',
          400: '#59adff', 500: '#338eff', 600: '#1c6ff5', 700: '#1559e1',
          800: '#1848b6', 900: '#1a408f', 950: '#152858',
        },
        invest: { 500: '#10b981', 600: '#059669' },
        expense: { 500: '#ef4444', 600: '#dc2626' },
        save: { 500: '#f59e0b', 600: '#d97706' },
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        'scale-in': { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
