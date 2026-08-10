/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy dark palette — kept as-is so any not-yet-migrated
        // component that still references bg-navy-900 etc. doesn't break.
        navy: {
          950: '#07080f',
          900: '#0d0f1e',
          800: '#111428',
          700: '#171b35',
          600: '#1e2442',
          500: '#252d52',
        },

        // ---- MySchool Connect design system ---------------------------
        // Primary brand gradient anchor (violet) + secondary (rose/pink)
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        blush: {
          50:  '#fff1f5',
          100: '#ffe4ec',
          200: '#fecdd9',
          300: '#fda4bb',
          400: '#fb7299',
          500: '#f43f8e',
          600: '#db2777',
        },
        // Soft fill colors for illustration accents / feature cards
        pastel: {
          blue:     '#DCEBFF',
          lavender: '#E6DFFF',
          pink:     '#FFE0EC',
          mint:     '#DFF7EC',
          peach:    '#FFEBD6',
          yellow:   '#FFF6D6',
        },
        // Neutral surface for the light app shell
        cloud: {
          50:  '#fbfaff',
          100: '#f5f4fb',
          200: '#edecf7',
        },
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgba(76, 29, 149, 0.06), 0 8px 24px -8px rgba(76, 29, 149, 0.08)',
        softer: '0 1px 4px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}