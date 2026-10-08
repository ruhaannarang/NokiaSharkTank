/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a2540',
        good: '#16a34a',
        unstable: '#d97706',
        poor: '#dc2626',
        fair: '#0284c7'
      },
      boxShadow: {
        card: '0 8px 30px rgba(10,37,64,0.08)'
      }
    }
  },
  plugins: []
}
