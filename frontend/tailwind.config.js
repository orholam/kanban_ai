/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(0.35rem)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'ai-brandish-sweep': {
          '0%': {
            opacity: '0',
            transform: 'translateX(-125%) skewX(-12deg)',
          },
          '22%': {
            opacity: '0.4',
          },
          '100%': {
            opacity: '0',
            transform: 'translateX(125%) skewX(-12deg)',
          },
        },
      },
      animation: {
        'ai-brandish-sweep': 'ai-brandish-sweep 1.05s cubic-bezier(0.33, 1, 0.68, 1) forwards',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class',
};
