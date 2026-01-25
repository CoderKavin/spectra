import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spectra: {
          // Metallic Noir Palette
          'near-black': '#05060A',
          'dark': '#0a0a15',
          'white-metal': '#EDEFF5',
          'violet-energy': '#7C3AED',
          'cool-edge': '#22D3EE',
          // Legacy colors
          black: '#000000',
          purple: '#8B5CF6',
          violet: '#7C3AED',
          blue: '#3B82F6',
          cyan: '#06B6D4',
          pink: '#EC4899',
          orange: '#F97316',
          gold: '#F59E0B',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 1s ease-out forwards',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'grain': 'grain 8s steps(10) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', filter: 'blur(20px)' },
          '50%': { opacity: '0.8', filter: 'blur(30px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'metallic-gradient': 'linear-gradient(135deg, rgba(237, 239, 245, 0.1) 0%, transparent 50%, rgba(237, 239, 245, 0.05) 100%)',
        'violet-glow': 'radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};

export default config;
