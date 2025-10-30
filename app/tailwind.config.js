/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: false, // 🚀 disable dark mode completely
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        sm: "0.8125rem", // ~13px
        base: "0.875rem", // ~14px (default body)
        lg: "1rem",       // 16px
        xl: "1.125rem",   // 18px
        "2xl": "1.25rem", // 20px
      },
    },
  },
  plugins: [],
};
