"use client"

import { useTheme } from "@/app/hooks/use-theme"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme, mounted } = useTheme()

  if (!mounted) return null

  return (
    <Sonner
      theme={theme === "dark" ? "dark" : "light"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
