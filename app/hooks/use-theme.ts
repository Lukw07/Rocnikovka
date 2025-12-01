"use client"

import { useEffect, useState, useCallback } from "react"

type Theme = "light" | "dark"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Get saved theme or system preference
    const savedTheme = localStorage.getItem("theme") as Theme | null
    let initialTheme: Theme = "light"
    
    if (savedTheme === "dark" || savedTheme === "light") {
      initialTheme = savedTheme
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      initialTheme = "dark"
    }
    
    setTheme(initialTheme)
    
    // Apply theme to DOM
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme: Theme = prevTheme === "light" ? "dark" : "light"
      
      localStorage.setItem("theme", newTheme)
      
      // Apply to DOM
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      
      return newTheme
    })
  }, [])

  return { theme, toggleTheme, mounted }
}

const SEASONAL_COLORS = {
  spring: "#10b981", // emerald-500
  summer: "#3b82f6", // blue-500
  autumn: "#f59e0b", // amber-500
  winter: "#6366f1", // indigo-500
}

export function useCustomColors() {
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6")
  const [accentColor, setAccentColor] = useState("#10b981")
  const [useSeasonal, setUseSeasonal] = useState(true)
  const [mounted, setMounted] = useState(false)

  const getSeason = useCallback(() => {
    const month = new Date().getMonth() + 1 // 1-12
    if (month >= 3 && month <= 5) return "spring"
    if (month >= 6 && month <= 8) return "summer"
    if (month >= 9 && month <= 11) return "autumn"
    return "winter"
  }, [])

  const hexToHsl = useCallback((hex: string) => {
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
  }, [])

  const applyColor = useCallback((color: string, type: 'primary' | 'secondary' | 'accent') => {
    const hsl = hexToHsl(color)
    if (hsl) {
      document.documentElement.style.setProperty(`--color-${type}-custom`, color)
      document.documentElement.style.setProperty(`--${type}`, hsl)
    }
  }, [hexToHsl])

  useEffect(() => {
    setMounted(true)
    
    const savedPrimary = localStorage.getItem("primaryColor")
    const savedSecondary = localStorage.getItem("secondaryColor")
    const savedAccent = localStorage.getItem("accentColor")
    const savedSeasonal = localStorage.getItem("useSeasonalColors")
    
    const isSeasonal = savedSeasonal === null ? true : savedSeasonal === "true"
    setUseSeasonal(isSeasonal)

    if (isSeasonal) {
      const season = getSeason()
      const color = SEASONAL_COLORS[season as keyof typeof SEASONAL_COLORS]
      applyColor(color, 'primary')
    } else if (savedPrimary) {
      setPrimaryColor(savedPrimary)
      applyColor(savedPrimary, 'primary')
    }
    
    if (savedSecondary) {
      setSecondaryColor(savedSecondary)
      applyColor(savedSecondary, 'secondary')
    }
    if (savedAccent) {
      setAccentColor(savedAccent)
      applyColor(savedAccent, 'accent')
    }
  }, [applyColor, getSeason])

  const updatePrimaryColor = useCallback((color: string) => {
    setPrimaryColor(color)
    localStorage.setItem("primaryColor", color)
    
    // If user manually sets color, disable seasonal
    if (useSeasonal) {
        setUseSeasonal(false)
        localStorage.setItem("useSeasonalColors", "false")
    }
    
    applyColor(color, 'primary')
  }, [applyColor, useSeasonal])

  const updateSecondaryColor = useCallback((color: string) => {
    setSecondaryColor(color)
    localStorage.setItem("secondaryColor", color)
    applyColor(color, 'secondary')
  }, [applyColor])

  const updateAccentColor = useCallback((color: string) => {
    setAccentColor(color)
    localStorage.setItem("accentColor", color)
    applyColor(color, 'accent')
  }, [applyColor])

  const toggleSeasonal = useCallback(() => {
    setUseSeasonal(prev => {
      const newValue = !prev
      localStorage.setItem("useSeasonalColors", String(newValue))
      
      if (newValue) {
        const season = getSeason()
        const color = SEASONAL_COLORS[season as keyof typeof SEASONAL_COLORS]
        applyColor(color, 'primary')
      } else {
        // Re-apply stored custom color
        applyColor(primaryColor, 'primary')
      }
      return newValue
    })
  }, [primaryColor, applyColor, getSeason])

  const resetColors = useCallback(() => {
    const defaultPrimary = "#3b82f6"
    const defaultSecondary = "#8b5cf6"
    const defaultAccent = "#10b981"
    
    setPrimaryColor(defaultPrimary)
    setSecondaryColor(defaultSecondary)
    setAccentColor(defaultAccent)
    setUseSeasonal(true)
    
    localStorage.removeItem("primaryColor")
    localStorage.removeItem("secondaryColor")
    localStorage.removeItem("accentColor")
    localStorage.removeItem("useSeasonalColors")
    
    const season = getSeason()
    const color = SEASONAL_COLORS[season as keyof typeof SEASONAL_COLORS]
    applyColor(color, 'primary')
    
    applyColor(defaultSecondary, 'secondary')
    applyColor(defaultAccent, 'accent')
  }, [applyColor, getSeason])

  return {
    primaryColor,
    secondaryColor,
    accentColor,
    useSeasonal,
    updatePrimaryColor,
    updateSecondaryColor,
    updateAccentColor,
    toggleSeasonal,
    resetColors,
    mounted
  }
}
