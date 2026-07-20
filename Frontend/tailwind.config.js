/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        slate: {
          950: '#f0f2f5', // Main light background grey
          900: '#ffffff', // Cards and secondary backgrounds
          850: '#f8fafc',
          800: '#e2e8f0', // Border lines
          700: '#cbd5e1', // Stronger border lines
          600: '#94a3b8',
          500: '#64748b',
          400: '#475569', // Muted body text
          300: '#334155', // Card headings / values
          200: '#1e293b',
          100: '#0f172a', // Primary black headings
        },
      },
    },
  },
  plugins: [],
}
