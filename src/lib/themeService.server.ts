import { getDatabase } from "./database";
import { ThemeConfig, DEFAULT_THEME } from "./themeService";

export async function getThemeConfig(): Promise<ThemeConfig> {
  try {
    const db = getDatabase();
    const settings = db.prepare("SELECT key, value FROM site_settings WHERE key LIKE 'theme_%'").all() as Array<{ key: string; value: string | null }>;
    
    const theme: ThemeConfig = JSON.parse(JSON.stringify(DEFAULT_THEME));
    
    // Parse settings and merge with default theme
    settings.forEach(({ key, value }) => {
      if (!value) return;
      
      const path = key.replace("theme_", "").split("_");
      let current: any = theme;
      
      // Special handling for colors with camelCase names (e.g., textPrimary, textSecondary)
      if (path[0] === "colors" && path.length > 2) {
        // theme_colors_textPrimary -> ["colors", "text", "Primary"] -> colors.textPrimary
        const colorName = path.slice(1).map((part, idx) => 
          idx === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join("");
        theme.colors[colorName] = value;
        return;
      }
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      
      const lastKey = path[path.length - 1];
      
      // Handle JSON values
      try {
        const parsed = JSON.parse(value);
        current[lastKey] = parsed;
      } catch {
        current[lastKey] = value;
      }
    });
    
    return theme;
  } catch (error) {
    console.error("Error loading theme config:", error);
    return DEFAULT_THEME;
  }
}

