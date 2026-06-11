export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "reusehub-navy": "#1a1f3a",
        "reusehub-dark-blue": "#0f1419",
        "reusehub-blue": "#0066ff",
        "reusehub-orange": "#FF6B2B",
        "reusehub-orange-light": "#ff7a3d",
        "reusehub-green": "#22c55e",
        "reusehub-green-dark": "#20c560",
        "reusehub-purple": "#8b5cf6",
        "reusehub-gray": "#666666",
        "reusehub-gray-dark": "#3D4560",
        "reusehub-light-blue-bg": "#e0f2fe",
        "reusehub-light-orange-bg": "#fff7ed",
        "reusehub-light-green-bg": "#ecfdf5",
        "reusehub-light-purple-bg": "#f3e8ff",
        "reusehub-light-pink-bg": "#fdf2f8",
        "reusehub-light-teal-bg": "#e0f7fa",
        "reusehub-light-yellow-bg": "#fffde7",
        "reusehub-light-slate-bg": "#f8fafc",
      },
      fontFamily: {
        "dm-sans": ['"DM Sans"', "sans-serif"],
        "plus-jakarta-sans": ['"Plus Jakarta Sans"', "sans-serif"],
      },
      backgroundImage: {
        "gradient-reusehub": "linear-gradient(to bottom, #1a2a4a, #000000)",
      },
    },
  },
  plugins: [],
};
