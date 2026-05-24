import type { Config } from "tailwindcss";

export default {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // 修仙主题色
        xiuxian: {
          gold: '#D4AF37',   // 天道金
          jade: '#10B981',   // 造化青
          crimson: '#E11D48', // 业火红
          purple: '#8B5CF6', // 幽冥紫
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
