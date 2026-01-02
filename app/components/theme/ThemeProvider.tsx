"use client"

import { useEffect } from "react"

const SEASONAL_COLORS = {
  spring: "#10b981", // emerald-500
  summer: "#3b82f6", // blue-500
  autumn: "#f59e0b", // amber-500
  winter: "#6366f1", // indigo-500
}

export const getSeason = () => {
  const month = new Date().getMonth() + 1 // 1-12
  if (month >= 3 && month <= 5) return "spring"
  if (month >= 6 && month <= 8) return "summer"
  if (month >= 9 && month <= 11) return "autumn"
  return "winter"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize custom colors only (theme is handled by useTheme hook)
    const primaryColor = localStorage.getItem("primaryColor")
    const secondaryColor = localStorage.getItem("secondaryColor")
    const accentColor = localStorage.getItem("accentColor")
    const savedSeasonal = localStorage.getItem("useSeasonalColors")
    const isSeasonal = savedSeasonal === null ? true : savedSeasonal === "true"

    if (isSeasonal) {
      const season = getSeason()
      const color = SEASONAL_COLORS[season as keyof typeof SEASONAL_COLORS]
      document.documentElement.style.setProperty("--color-primary-custom", color)
      const hsl = hexToHsl(color)
      if (hsl) {
        document.documentElement.style.setProperty("--primary", hsl)
      }
    } else if (primaryColor) {
      document.documentElement.style.setProperty("--color-primary-custom", primaryColor)
      const hsl = hexToHsl(primaryColor)
      if (hsl) {
        document.documentElement.style.setProperty("--primary", hsl)
      }
    }

    if (secondaryColor) {
      document.documentElement.style.setProperty("--color-secondary-custom", secondaryColor)
      const hsl = hexToHsl(secondaryColor)
      if (hsl) {
        document.documentElement.style.setProperty("--secondary", hsl)
      }
    }

    if (accentColor) {
      document.documentElement.style.setProperty("--color-accent-custom", accentColor)
      const hsl = hexToHsl(accentColor)
      if (hsl) {
        document.documentElement.style.setProperty("--accent", hsl)
      }
    }
  }, [])

  return <>{children}</>
}

function hexToHsl(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  
  r /= 255;
  g /= 255;
  b /= 255;
  
  const cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin;
  let h = 0, s = 0, l = 0;

  if (delta === 0)
    h = 0;
  else if (cmax === r)
    h = ((g - b) / delta) % 6;
  else if (cmax === g)
    h = (b - r) / delta + 2;
  else
    h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0)
    h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
}
