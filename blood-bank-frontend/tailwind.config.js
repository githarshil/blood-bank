/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#f8fafc',
          sidebar: '#7f1d1d',
          surface: '#ffffff',
          border: '#e2e8f0',
          hover: '#fafafa',
          active: 'rgba(255, 255, 255, 0.15)',
        },
        accent: {
          DEFAULT: '#dc2626',
          hover: '#b91c1c',
        },
        text: {
          primary: '#0f172a',
          muted: '#64748b',
        },
        status: {
          green: '#059669',
          amber: '#d97706',
          red: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['"Outfit"', '"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}
