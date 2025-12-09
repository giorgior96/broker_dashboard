/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#1e3a8a", // Blu from ig.py
                secondary: "#64748b",
                card: "#FFFFFF",
                background: "#F5F5F5",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Modern font
                display: ['Bricolage Grotesque', 'sans-serif'], // From ig.py if available, can fallback
            }
        },
    },
    plugins: [],
}
