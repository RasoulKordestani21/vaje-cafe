/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-family)", "sans-serif"],
        serif: ["var(--font-family)", "serif"]
      },
      fontSize: {
        xs:   "var(--font-size-xs)",
        sm:   "var(--font-size-sm)",
        base: "var(--font-size-base)",
        lg:   "var(--font-size-lg)",
        xl:   "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
        "3xl": "var(--font-size-3xl)",
        "4xl": "var(--font-size-4xl)",
      },
      fontWeight: {
        normal:   "var(--font-weight-normal)",
        medium:   "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
        bold:     "var(--font-weight-bold)",
      },
      lineHeight: {
        tight:   "var(--line-height-tight)",
        normal:  "var(--line-height-normal)",
        relaxed: "var(--line-height-relaxed)",
      },
      spacing: {
        xs:   "var(--spacing-xs)",
        sm:   "var(--spacing-sm)",
        md:   "var(--spacing-md)",
        lg:   "var(--spacing-lg)",
        xl:   "var(--spacing-xl)",
        "2xl": "var(--spacing-2xl)",
        "3xl": "var(--spacing-3xl)",
      },
      colors: {
        // ── Semantic theme tokens (fed via CSS vars) ──────────────────────
        "theme-primary":          "var(--color-primary)",
        "theme-secondary":        "var(--color-secondary)",
        "theme-accent":           "var(--color-accent)",
        "theme-success":          "var(--color-success)",
        "theme-warning":          "var(--color-warning)",
        "theme-error":            "var(--color-error)",
        "theme-info":             "var(--color-info)",
        "theme-background":       "var(--color-background)",
        "theme-surface":          "var(--color-surface)",
        "theme-text-primary":     "var(--color-textPrimary)",
        "theme-text-secondary":   "var(--color-textSecondary)",
        "theme-text-muted":       "var(--color-textMuted)",
        "theme-border":           "var(--color-border)",

        // ── shadcn legacy tokens ──────────────────────────────────────────
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // ── Primary (forest green — from reference images) ───────────────
        primary: {
          DEFAULT:    "var(--color-primary)",
          foreground: "hsl(var(--primary-foreground))",
          50:  "#edf7f1",
          100: "#d0ece0",
          200: "#a3d8c1",
          300: "#6ec0a0",
          400: "#3da47d",
          500: "#1f7a56",   // mid CTA green
          600: "#186244",   // primary brand
          700: "#124d35",
          800: "#0d3926",
          900: "#082618",
          950: "#041409",
        },

        secondary: {
          DEFAULT:    "var(--color-secondary)",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "var(--color-error)",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "var(--color-accent)",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "var(--color-surface)",
          foreground: "hsl(var(--card-foreground))",
        },

        // ── Forest (deep brand greens — navbars, hero overlays) ──────────
        forest: {
          50:  "#f0f9f4",
          100: "#d8f0e5",
          200: "#b4e1cc",
          300: "#83c9aa",
          400: "#4fab84",
          500: "#2d8f68",
          600: "#1f7251",
          700: "#1a5c42",
          800: "#174937",
          900: "#133c2e",
          950: "#0a2119",
        },

        // ── Coffee (warm brown — prices, badges, accents) ─────────────────
        coffee: {
          50:  "#fdf8f3",
          100: "#f7eddf",
          200: "#eed8be",
          300: "#e3bf97",
          400: "#d4a06a",
          500: "#c4834a",
          600: "#b06a35",
          700: "#92542c",
          800: "#764529",
          900: "#5e3922",
          950: "#331e12",
        },

        // ── Gold (premium accent — stars, highlights) ─────────────────────
        gold: {
          DEFAULT: "var(--user-gold)",
          50:  "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },

        // ── Cream (warm neutral — light mode surfaces) ────────────────────
        cream: {
          50:  "#fefdfb",
          100: "#faf8f4",
          200: "#f5f0e8",
          300: "#ede6d8",
          400: "#e2d8c6",
          500: "#d4c8b0",
          600: "#bfaf93",
          700: "#a69374",
          800: "#8a7757",
          900: "#6e5e42",
        },

        // ── User page surface aliases (fed from CSS vars) ─────────────────
        brand: {
          DEFAULT: "var(--user-brand)",
          hover:   "var(--user-brand-hover)",
        },
        user: {
          page:                 "var(--user-page)",
          "page-dark":          "var(--user-page-dark)",
          surface:              "var(--user-surface)",
          "surface-dark":       "var(--user-surface-dark)",
          "surface-elevated":   "var(--user-surface-elevated)",
          "surface-elevated-dark": "var(--user-surface-elevated-dark)",
          muted:                "var(--user-muted)",
          "muted-dark":         "var(--user-muted-dark)",
          text:                 "var(--user-text)",
          "text-dark":          "var(--user-text-dark)",
          "text-secondary":     "var(--user-text-secondary)",
          "text-secondary-dark":"var(--user-text-secondary-dark)",
          border:               "var(--user-border)",
          "border-dark":        "var(--user-border-dark)",
        },

        // ── Admin panel surfaces (light mode) ─────────────────────────────
        admin: {
          canvas:          "var(--admin-canvas)",
          sidebar:         "var(--admin-sidebar)",
          surface:         "var(--admin-surface)",
          muted:           "var(--admin-muted)",
          border:          "var(--admin-border)",
          "border-strong": "var(--admin-border-strong)",
          primary:         "var(--admin-primary)",
          secondary:       "var(--admin-secondary)",
          "muted-text":    "var(--admin-muted-text)",
        },
      },

      borderRadius: {
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full:  "var(--radius-full)",
      },

      boxShadow: {
        sm:   "var(--shadow-sm)",
        md:   "var(--shadow-md)",
        lg:   "var(--shadow-lg)",
        xl:   "var(--shadow-xl)",
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
        nav:  "var(--shadow-nav)",
        "admin-card":       "0 1px 2px rgb(15 23 42 / 0.05), 0 4px 14px -2px rgb(15 23 42 / 0.08)",
        "admin-card-hover": "0 2px 4px rgb(15 23 42 / 0.06), 0 8px 20px -4px rgb(15 23 42 / 0.10)",
        "admin-header":     "0 1px 0 rgb(15 23 42 / 0.08)",
      },

      transitionDuration: {
        fast:   "var(--transition-fast)",
        normal: "var(--transition-normal)",
        slow:   "var(--transition-slow)",
      },

      screens: {
        // Literal values required — CSS vars don't work inside @media queries
        sm:   "640px",
        md:   "768px",
        lg:   "1024px",
        xl:   "1280px",
        "2xl": "1400px",
      },
    }
  },
  darkMode: "class",
  plugins: []
};
