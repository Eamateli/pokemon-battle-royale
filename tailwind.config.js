/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      animation: {
        'bounce-in': 'bounce-in 0.6s ease-out',
        'pulse': 'pulse 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        'bounce-in': {
          '0%': {
            transform: 'scale(0.3)',
            opacity: '0'
          },
          '50%': {
            transform: 'scale(1.05)'
          },
          '70%': {
            transform: 'scale(0.9)'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        'glow': {
          'from': {
            'box-shadow': '0 0 20px rgba(251, 191, 36, 0.5)'
          },
          'to': {
            'box-shadow': '0 0 30px rgba(251, 191, 36, 0.8)'
          }
        }
      }
    },
  },
  plugins: [],
}