/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        priority: {
          high: "#dc2626",
          medium: "#d97706",
          low: "#2563eb",
          unknown: "#6b7280",
        },
      },
    },
  },
  plugins: [],
}

