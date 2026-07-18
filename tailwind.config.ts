import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wing: {
          bg: '#0A0E14',
          raised: '#111722',
          border: '#232B3A',
          text: '#E8ECF4',
          dim: '#8A94A8',
          signal: '#3DDC97',
          ai: '#8B7CF6',
          warn: '#F5B15C',
        },
      },
      fontFamily: {
        display: ['var(--font-bricolage)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '2xl': '14px',
        '3xl': '20px',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'pulse-scale': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        'sparkle-pulse': {
          '0%': { opacity: '0.5' },
          '25%': { opacity: '1' },
          '50%': { opacity: '0.5' },
          '75%': { opacity: '1' },
          '100%': { opacity: '0.5' },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        'pulse-scale': 'pulse-scale 0.7s ease-in-out 1',
        'sparkle-pulse': 'sparkle-pulse 0.5s ease-in-out 1',
      },
    },
  },
  plugins: [],
}

export default config
