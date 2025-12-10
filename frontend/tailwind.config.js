/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        stacks: {
          purple: '#5546FF',
          dark: '#141416',
        },
      },
    },
  },
  plugins: [],
};
