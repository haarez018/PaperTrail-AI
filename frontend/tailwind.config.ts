import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: "#E8751A",
          light: "#FFF3E6",
          dark: "#C45E0A",
        },
        navy: {
          DEFAULT: "#1B2A4A",
          light: "#2D4470",
        },
        ivory: "#FEFCF6",
        paper: {
          DEFAULT: "#F5F0E8",
          dark: "#E8E0D0",
        },
        success: "#2E7D32",
        warning: "#E65100",
        danger: "#C62828",
        info: "#1565C0",
        pending: "#78909C",
        "text-primary": "#1B2A4A",
        "text-secondary": "#546E7A",
        "text-muted": "#90A4AE",
      },
      fontFamily: {
        display: ['"DM Serif Display"', '"Source Sans 3"', 'serif'],
        sans: ['"Source Sans 3"', '"Noto Sans Tamil"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        tamil: ['"Noto Sans Tamil"', '"Source Sans 3"', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', '"Source Sans 3"', 'sans-serif'],
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.5rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl':  ['3rem',     { lineHeight: '1' }],
      },
      boxShadow: {
        'card':       '0 2px 12px rgba(27,42,74,0.08)',
        'card-hover': '0 4px 20px rgba(27,42,74,0.14)',
        'modal':      '0 8px 40px rgba(27,42,74,0.20)',
      },
      borderRadius: {
        'sm-custom': '6px',
        'md-custom': '10px',
        'lg-custom': '16px',
        'xl-custom': '24px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-custom': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'enter': 'cubic-bezier(0, 0, 0.2, 1)',
        'exit': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      animation: {
        'pulse-saffron': 'pulse-saffron 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'stamp': 'stamp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'pulse-saffron': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'stamp': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
