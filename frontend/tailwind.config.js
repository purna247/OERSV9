/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans:     'var(--font-sans)',
        mono:     'var(--font-mono)',
        headline: 'var(--font-sans)',
        body:     'var(--font-sans)',
        label:    'var(--font-sans)',
      },
      transitionDuration: {
        'fast':    'var(--duration-fast)',
        'normal':  'var(--duration-normal)',
        'slow':    'var(--duration-slow)',
        'slower':  'var(--duration-slower)',
        'slowest': 'var(--duration-slowest)',
      },
      transitionTimingFunction: {
        'default': 'var(--easing-default)',
        'in':      'var(--easing-in)',
        'out':     'var(--easing-out)',
        'in-out':  'var(--easing-in-out)',
      },
    },
  },
  plugins: [],
}
