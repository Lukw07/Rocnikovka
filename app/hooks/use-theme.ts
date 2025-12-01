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

export function useCustomColors() {
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6")
  const [accentColor, setAccentColor] = useState("#10b981")
  const [mounted, setMounted] = useState(false)

  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1]!, 16),
      g: parseInt(result[2]!, 16),
      b: parseInt(result[3]!, 16)
    } : null
  }, [])

  const applyColor = useCallback((color: string, type: 'primary' | 'secondary' | 'accent') => {
    const rgb = hexToRgb(color)
    if (rgb) {
      document.documentElement.style.setProperty(`--color-${type}-custom`, color)
      document.documentElement.style.setProperty(`--${type}-rgb`, `${rgb.r} ${rgb.g} ${rgb.b}`)
    }
  }, [hexToRgb])

  useEffect(() => {
    setMounted(true)
    
    const savedPrimary = localStorage.getItem("primaryColor")
    const savedSecondary = localStorage.getItem("secondaryColor")
    const savedAccent = localStorage.getItem("accentColor")
    
    if (savedPrimary) {
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
  }, [applyColor])

  const updatePrimaryColor = useCallback((color: string) => {
    setPrimaryColor(color)
    localStorage.setItem("primaryColor", color)
    applyColor(color, 'primary')
  }, [applyColor])

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

  const resetColors = useCallback(() => {
    const defaultPrimary = "#3b82f6"
    const defaultSecondary = "#8b5cf6"
    const defaultAccent = "#10b981"
    
    setPrimaryColor(defaultPrimary)
    setSecondaryColor(defaultSecondary)
    setAccentColor(defaultAccent)
    localStorage.removeItem("primaryColor")
    localStorage.removeItem("secondaryColor")
    localStorage.removeItem("accentColor")
    applyColor(defaultPrimary, 'primary')
    applyColor(defaultSecondary, 'secondary')
    applyColor(defaultAccent, 'accent')
  }, [applyColor])

  return {
    primaryColor,
    secondaryColor,
    accentColor,
    updatePrimaryColor,
    updateSecondaryColor,
    updateAccentColor,
    resetColors,
    mounted
  }
}
