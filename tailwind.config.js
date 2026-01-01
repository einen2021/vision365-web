/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        fire: '#ff5722',
        trouble: '#FFC107',
        supervisory: '#FF9800',
        cardBg: '#ffffff',
        cardBorder: '#e5e7eb',
        textPrimary: '#212529',
        textSecondary: '#6c757d',
        textLight: '#9ca3af',
      },
      borderRadius: {
        'card': '12px',
        'status-card': '16px',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'card-active': '0 4px 6px rgba(0, 0, 0, 0.2)',
        'modal': '0 2px 8px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}

