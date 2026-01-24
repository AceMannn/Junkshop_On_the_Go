// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}", // scan all JS/JSX files for classes
    ],
    theme: {
        extend: {
            colors: {
                "eco-green": "#3DA35D",
                "leaf-green": "#65C18C",
                "clean-blue": "#4F9EFF",
                "sunny-yellow": "#FFD34E",
                "light-gray": "#F2F2F2",
                "charcoal": "#2E2E2E",
                "red-50": "#ffe5e5",
                "red-200": "#fca5a5",
                "red-500": "#ef4444",
            },
            fontFamily: {
                base: ["Inter", "system-ui", "-apple-system", "sans-serif"],
            },
            spacing: {
                1: "8px",
                2: "16px",
                3: "24px",
                4: "32px",
                5: "40px",
                6: "48px",
                8: "64px",
            },
            borderRadius: {
                button: "12px",
                card: "16px",
            },
            maxWidth: {
                "4xl": "56rem",
                "7xl": "80rem",
            },
            minHeight: {
                screen: "100vh",
            },
        },
    },
    plugins: [],
};
