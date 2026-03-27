/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "reusehub-navy": "#15244B",
        "reusehub-blue": "#165CF0",
        "reusehub-orange": "#FC7D12",
        "reusehub-green": "#22c55e",
        "reusehub-purple": "#8b5cf6",
        "reusehub-gray": "#666666",
      },
      backgroundImage: {
        "gradient-reusehub": "linear-gradient(to bottom, #1a2a4a, #000000)",
      },
      textAlign: {
        start: "start",
      },
    },
  },
  plugins: [],
};
