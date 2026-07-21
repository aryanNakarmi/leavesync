const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Core brand — deeper, more premium blue
        "primary": "#1a56db",
        "primary-container": "#3b82f6",
        "primary-fixed": "#eef2ff",
        "primary-fixed-dim": "#c7d2fe",
        "on-primary": "#ffffff",
        "on-primary-fixed": "#1e3a8a",
        "on-primary-fixed-variant": "#2563eb",
        "on-primary-container": "#dbeafe",

        // Surfaces — warmer, more natural feel
        "surface": "#fafafa",
        "surface-dim": "#e5e5e5",
        "surface-container-low": "#f5f5f5",
        "surface-container": "#eeeeee",
        "surface-container-high": "#e8e8e8",
        "surface-container-highest": "#e0e0e0",
        "surface-container-lowest": "#ffffff",
        "surface-bright": "#fafafa",
        "on-surface": "#171717",
        "on-surface-variant": "#525252",

        // Background
        "background": "#fafafa",
        "on-background": "#171717",

        // Secondary — warm gray for a natural complement
        "secondary": "#57534e",
        "secondary-fixed": "#f5f0eb",
        "secondary-fixed-dim": "#d6d3cc",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#57534e",
        "on-secondary-fixed": "#292524",
        "on-secondary-fixed-variant": "#44403c",

        // Outline — softer borders
        "outline": "#a3a3a3",
        "outline-variant": "#d4d4d4",

        // Error — softer red
        "error": "#dc2626",
        "on-error": "#ffffff",
        "error-container": "#fef2f2",
        "on-error-container": "#991b1b",

        // Success
        "success": "#16a34a",
        "success-container": "#f0fdf4",
        "on-success": "#ffffff",
        "on-success-container": "#166534",

        // Warning
        "warning": "#d97706",
        "warning-container": "#fffbeb",
        "on-warning": "#ffffff",
        "on-warning-container": "#92400e",

        // Tertiary — subtle accent
        "tertiary": "#0d9488",
        "tertiary-container": "#14b8a6",
        "tertiary-fixed": "#f0fdfa",
        "tertiary-fixed-dim": "#99f6e4",
        "on-tertiary": "#ffffff",
        "on-tertiary-fixed": "#134e4a",
        "on-tertiary-fixed-variant": "#0f766e",
        "on-tertiary-container": "#ccfbf1",

        // Inverse
        "inverse-surface": "#262626",
        "inverse-primary": "#c7d2fe",
        "inverse-on-surface": "#fafafa",
        "surface-tint": "#1a56db",
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        display: ["Inter", ...defaultTheme.fontFamily.sans],
        body: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'card-active': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
};
