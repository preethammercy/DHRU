/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintrix: {
          bg: '#FFFFFF',
          bgSubtle: '#F8FAFC',
          bgBlue: '#F0F6FF',
          card: '#FFFFFF',
          cardHover: '#F8FAFF',
          border: '#E2E8F0',
          borderBlue: '#DBEAFE',
          text: '#0F172A',
          textMuted: '#64748B',
          primary: '#2563EB',
          primaryHover: '#1D4ED8',
          cyan: '#0284C7',
          sky: '#38BDF8',
          gain: '#059669',
          gainBg: '#ECFDF5',
          loss: '#DC2626',
          lossBg: '#FEF2F2',
          warning: '#D97706',
          warningBg: '#FFFBEB',
        },
        dhru: {
          bg: '#FFFFFF',
          card: '#FFFFFF',
          cardHover: '#F8FAFF',
          border: '#E2E8F0',
          borderLight: '#DBEAFE',
          text: '#0F172A',
          muted: '#64748B',
          cyan: '#0284C7',
          blue: '#2563EB',
          gain: '#059669',
          loss: '#DC2626',
          warning: '#D97706',
          purple: '#7C3AED',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(37, 99, 235, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 20px 35px -5px rgba(37, 99, 235, 0.12), 0 10px 15px -3px rgba(37, 99, 235, 0.06)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}
