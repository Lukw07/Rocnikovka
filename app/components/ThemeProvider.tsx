"use client"

import { useEffect } from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize custom colors only (theme is handled by useTheme hook)
    const primaryColor = localStorage.getItem("primaryColor")
    const secondaryColor = localStorage.getItem("secondaryColor")
    const accentColor = localStorage.getItem("accentColor")

    if (primaryColor) {
      document.documentElement.style.setProperty("--color-primary-custom", primaryColor)
      const rgb = hexToRgb(primaryColor)
      if (rgb) {
        document.documentElement.style.setProperty("--primary-rgb", `${rgb.r} ${rgb.g} ${rgb.b}`)
      }
    }

    if (secondaryColor) {
      document.documentElement.style.setProperty("--color-secondary-custom", secondaryColor)
      const rgb = hexToRgb(secondaryColor)
      if (rgb) {
        document.documentElement.style.setProperty("--secondary-rgb", `${rgb.r} ${rgb.g} ${rgb.b}`)
      }
    }

    if (accentColor) {
      document.documentElement.style.setProperty("--color-accent-custom", accentColor)
      const rgb = hexToRgb(accentColor)
      if (rgb) {
        document.documentElement.style.setProperty("--accent-rgb", `${rgb.r} ${rgb.g} ${rgb.b}`)
      }
    }
  }, [])

  return <>{children}</>
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16)
  } : null
}
