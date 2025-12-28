/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#e94560',
          dark: '#c73b52',
          light: '#ff6b7a',
        },
        secondary: {
          DEFAULT: '#16213e',
          dark: '#0f1729',
          light: '#1a2744',
        },
        accent: {
          DEFAULT: '#0f3460',
          dark: '#0a2340',
          light: '#1a4a7a',
        },
        dark: {
          DEFAULT: '#1a1a2e',
          darker: '#0f0f1a',
          lighter: '#252542',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
