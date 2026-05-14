/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        biscoite: {
          dark: '#001A26',    // Azul marinho profundo do footer
          primary: '#4A72B2', // Azul dos botões
          bg: '#F8FAFC',      // Slate-50 (fundo do sistema)
          brand: '#6385B7',   // O novo azul do seu logo
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      // --- AS ANIMAÇÕES QUE ADICIONAMOS ---
      animation: {
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.1', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}