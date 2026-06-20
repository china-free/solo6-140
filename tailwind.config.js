/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          navy: '#0f1c3f',
          navy2: '#1a2d5c',
          orange: '#FF6B35',
          pink: '#FF4D6D',
          teal: '#4ECDC4',
          green: '#3ECF8E',
          red: '#FF6B6B',
          yellow: '#FFE66D',
          purple: '#6C5CE7'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        'scale-in': {
          '0%': { opacity: 0, transform: 'scale(0.9)' },
          '100%': { opacity: 1, transform: 'scale(1)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }
    },
  },
  plugins: [],
};
