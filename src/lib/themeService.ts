export interface ThemeConfig {
  // Colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
  };
  
  // Typography
  typography: {
    fontFamily: string;
    fontSizeBase: string;
    fontSizeScale: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      "2xl": string;
      "3xl": string;
      "4xl": string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeight: {
      tight: string;
      normal: string;
      relaxed: string;
    };
  };
  
  // Spacing
  spacing: {
    base: string;
    scale: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      "2xl": string;
      "3xl": string;
    };
  };
  
  // Components
  components: {
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      full: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    transitions: {
      fast: string;
      normal: string;
      slow: string;
    };
  };
  
  // Responsive
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
}

const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: "#00422A",
    secondary: "#D2691E",
    accent: "#CD853F",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
    background: "#0f0f0f",
    surface: "#1a1a1a",
    textPrimary: "#eaddd7",
    textSecondary: "#d2bab0",
    textMuted: "#a77f70",
    border: "#2a2a2a",
  },
  typography: {
    fontFamily: "var(--font-vazirmatn), Tahoma, Arial, sans-serif",
    fontSizeBase: "16px",
    fontSizeScale: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },
  spacing: {
    base: "0.25rem",
    scale: {
      xs: "0.5rem",
      sm: "1rem",
      md: "1.5rem",
      lg: "2rem",
      xl: "3rem",
      "2xl": "4rem",
      "3xl": "6rem",
    },
  },
  components: {
    borderRadius: {
      sm: "0.25rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
      full: "9999px",
    },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    },
    transitions: {
      fast: "150ms",
      normal: "300ms",
      slow: "500ms",
    },
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1400px",
  },
};

// Export DEFAULT_THEME for use in server-side code
export { DEFAULT_THEME };

export function applyThemeToDocument(theme: ThemeConfig) {
  if (typeof document === "undefined") return;
  
  const root = document.documentElement;
  
  // Apply colors as CSS variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Apply typography
  root.style.setProperty("--font-family", theme.typography.fontFamily);
  root.style.setProperty("--font-size-base", theme.typography.fontSizeBase);
  Object.entries(theme.typography.fontSizeScale).forEach(([key, value]) => {
    root.style.setProperty(`--font-size-${key}`, value);
  });
  Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
    root.style.setProperty(`--font-weight-${key}`, value);
  });
  Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
    root.style.setProperty(`--line-height-${key}`, value);
  });
  
  // Apply spacing
  root.style.setProperty("--spacing-base", theme.spacing.base);
  Object.entries(theme.spacing.scale).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value);
  });
  
  // Apply components
  Object.entries(theme.components.borderRadius).forEach(([key, value]) => {
    // --radius-full powers Tailwind's rounded-full; it must stay a large value.
    // Theme admin may store a small value (e.g. 10px) which breaks circles.
    if (key === "full") {
      root.style.setProperty("--radius-full", "9999px");
      return;
    }
    root.style.setProperty(`--radius-${key}`, value);
  });
  Object.entries(theme.components.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });
  Object.entries(theme.components.transitions).forEach(([key, value]) => {
    root.style.setProperty(`--transition-${key}`, value);
  });
  
  // Apply breakpoints
  Object.entries(theme.breakpoints).forEach(([key, value]) => {
    root.style.setProperty(`--breakpoint-${key}`, value);
  });
}

