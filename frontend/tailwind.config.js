/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        surface: '#020617',
        primary: '#22c55e',
        secondary: '#38bdf8',
        accent: '#f97316',
      },
    },
  },
  plugins: [],
}

