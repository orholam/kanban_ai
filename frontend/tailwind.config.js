/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(1rem)',
            filter: 'blur(4px)'
          },
          '60%': {
            transform: 'translateY(0)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
            filter: 'blur(0)'
          },
        }
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class',
};
