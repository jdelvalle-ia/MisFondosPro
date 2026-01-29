/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./types.ts"
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-background)',
        card: 'var(--bg-card)',
        neon: '#00FFCC',
        violet: '#8A2BE2',
        surface: 'var(--bg-surface)',
        text: 'var(--text-main)',
        subtext: 'var(--text-muted)'
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 255, 204, 0.3)',
        'neon-strong': '0 0 20px rgba(0, 255, 204, 0.5)',
        'violet': '0 0 10px rgba(138, 43, 226, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: [],
}