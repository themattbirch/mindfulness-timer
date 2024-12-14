// tailwind.config.js
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { light: "#A8DADC", DEFAULT: "#457B9D", dark: "#1D3557" },
        secondary: { light: "#F1FAEE", DEFAULT: "#E63946", dark: "#B5838D" },
        accent: { DEFAULT: "#F4A261" },
        neutral: { light: "#F0F4FF", DEFAULT: "#FFFFFF", dark: "#333333" },
      },
    },
  },
  plugins: [],
};
