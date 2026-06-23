const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "primary": "#004ac6",
        "primary-container": "#2563eb",
        "primary-fixed": "#dbe1ff",
        "primary-fixed-dim": "#b4c5ff",
        "on-primary": "#ffffff",
        "on-primary-fixed": "#00174b",
        "on-primary-fixed-variant": "#003ea8",
        "on-primary-container": "#eeefff",
        "surface": "#faf8ff",
        "surface-dim": "#d9d9e5",
        "surface-container-low": "#f3f3fe",
        "surface-container": "#ededf9",
        "surface-container-high": "#e7e7f3",
        "surface-container-highest": "#e1e2ed",
        "surface-container-lowest": "#ffffff",
        "surface-bright": "#faf8ff",
        "on-surface": "#191b23",
        "on-surface-variant": "#434655",
        "background": "#faf8ff",
        "on-background": "#191b23",
        "secondary": "#505f76",
        "secondary-fixed": "#d3e4fe",
        "secondary-fixed-dim": "#b7c8e1",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#54647a",
        "on-secondary-fixed": "#0b1c30",
        "on-secondary-fixed-variant": "#38485d",
        "outline": "#737686",
        "outline-variant": "#c3c6d7",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "tertiary": "#943700",
        "tertiary-container": "#bc4800",
        "tertiary-fixed": "#ffdbcd",
        "tertiary-fixed-dim": "#ffb596",
        "on-tertiary": "#ffffff",
        "on-tertiary-fixed": "#360f00",
        "on-tertiary-fixed-variant": "#7d2d00",
        "on-tertiary-container": "#ffede6",
        "inverse-surface": "#2e3039",
        "inverse-primary": "#b4c5ff",
        "inverse-on-surface": "#f0f0fb",
        "surface-tint": "#0053db"
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        display: ["Inter", ...defaultTheme.fontFamily.sans],
        body: ["Inter", ...defaultTheme.fontFamily.sans]
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "10px",
        xl: "0.75rem",
        full: "9999px"
      }
    }
  },
  plugins: []
};
