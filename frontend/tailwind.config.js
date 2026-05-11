/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg      : '#0B1120',
        surface : '#111827',
        'surface-2': '#1F2937',
        border  : '#1F2937',
        primary : '#2563EB',
        'primary-hover': '#1D4ED8',
        accent  : '#7C3AED',
        'text-primary'  : '#E5E7EB',
        'text-secondary': '#94A3B8',
        success : '#10B981',
        warning : '#F59E0B',
        danger  : '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        head: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card : '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        glow : '0 0 20px rgba(37,99,235,0.15)',
      },
    },
  },
  plugins: [],
};
