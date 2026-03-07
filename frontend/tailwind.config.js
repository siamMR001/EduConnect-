/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    light: '#6366f1', // Indigo 500
                    DEFAULT: '#4f46e5', // Indigo 600
                    dark: '#4338ca', // Indigo 700
                },
                background: {
                    DEFAULT: '#0f172a', // Slate 900
                    paper: '#1e293b', // Slate 800
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
