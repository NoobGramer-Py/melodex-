/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#141414',
        surfaceHover: '#1a1a1a',
        border: '#2a2a2a',
        accent: '#1DB954',
        accentHover: '#1ed760',
        text: '#ffffff',
        textSecondary: '#a0a0a0',
        textMuted: '#6a6a6a',
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-out-right': 'slideOutRight 0.3s ease-in',
        'fade-in': 'fadeIn 0.2s ease-out',
        'skeleton-pulse': 'skeletonPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideOutRight: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        skeletonPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};
