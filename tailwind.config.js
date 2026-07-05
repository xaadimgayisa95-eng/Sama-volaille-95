/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vert: {
          DEFAULT: '#1E5C20',
          light: '#2D7A30',
          dark: '#133D15',
          bg: '#EEF6EE',
        },
        jaune: {
          DEFAULT: '#F5C518',
          dark: '#D4A800',
        },
        terre: '#C1440E',
        blanc: '#FAFAF8',
        blanc2: '#F2F2EF',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Noto Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '14px',
        '3xl': '20px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'fab': '0 4px 16px rgba(30, 92, 32, 0.4)',
      },
    },
  },
  plugins: [],
};
