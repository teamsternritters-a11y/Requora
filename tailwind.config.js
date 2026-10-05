/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        // Brand: Deep Teal (matches the dark teal CTA buttons in the UI image)
        brand: {
          50:  '#e0f2f1',
          100: '#b2dfdb',
          200: '#80cbc4',
          300: '#4db6ac',
          400: '#26a69a',
          500: '#009688',
          600: '#00796b',
          700: '#00695c',
          800: '#004d40',
          900: '#003d33',
          950: '#00251a',
        },
        // Accent: Sky blue (secondary actions)
        accent: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Surface: Light mode grays (slate scale)
        // 50  = darkest text (slate-900 equivalent)
        // 900 = app background (slate-50 equivalent)
        surface: {
          50:  '#0f172a', // Primary text
          100: '#1e293b', // Secondary text
          200: '#334155', // Tertiary text
          300: '#475569', // Muted text
          400: '#64748b', // Placeholder text
          500: '#94a3b8', // Disabled text
          600: '#cbd5e1', // Border (hover)
          700: '#e2e8f0', // Border (default)
          800: '#f8fafc', // Input background / subtle bg
          900: '#f8fafc', // App background (same as slate-50)
          950: '#f1f5f9', // Slightly darker bg (slate-100)
          DEFAULT: '#f8fafc',
        },
      },
      backgroundImage: {
        'gradient-hero':   'linear-gradient(135deg, #00695c 0%, #004d40 50%, #00251a 100%)',
        'gradient-brand':  'linear-gradient(135deg, #009688 0%, #00796b 100%)',
        'gradient-accent': 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06)',
        'card-lg': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '.5' },
        },
      },
      animation: {
        'float':    'float 4s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in':  'fade-in 0.3s ease-out',
        'pulse':    'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
}
