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
      },
      keyframes: {
        shimmer: {
          '0%': {
            backgroundPosition: '100% 50%',
          },
          '100%': {
            backgroundPosition: '0% 50%',
          },
        }
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
      backgroundSize: {
        'shimmer': '200% auto',
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, #666666 0%, #999999 30%, #666666 60%, #999999 100%)',
      },
    },
  },
  plugins: [],
}

