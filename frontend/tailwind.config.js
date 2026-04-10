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
        /** Rotating sweep for CTA border “pulse” (Landing variant B hero). */
        'cta-border-sweep': {
          '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
          '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
        },
      },
      animation: {
        'ai-brandish-sweep': 'ai-brandish-sweep 1.05s cubic-bezier(0.33, 1, 0.68, 1) forwards',
        'cta-border-sweep': 'cta-border-sweep 2.8s linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class',
};
