"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SignInPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: true,
          callbackUrl: "/dashboard"
      })

      if (result?.error) {
        // Map NextAuth error codes to user-friendly messages
        const errorMessages: Record<string, string> = {
          'CredentialsSignin': 'Nesprávné uživatelské jméno nebo heslo. Zkontrolujte své Bakaláři přihlašovací údaje.',
          'Configuration': 'Chyba konfigurace. Kontaktujte správce systému.',
          'AccessDenied': 'Přístup odepřen. Kontaktujte správce systému.',
          'Verification': 'Ověření selhalo. Zkuste to znovu.',
          'Default': 'Nastala neočekávaná chyba. Zkuste to znovu.'
        }
        
        const userFriendlyError = errorMessages[result.error] || errorMessages['Default']
        setError(userFriendlyError || 'Nastala neočekávaná chyba. Zkuste to znovu.')
      } else if (result?.ok) {
          router.replace('/dashboard')
          router.refresh()   // <- critical: updates the server tree to read new cookies
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
      </div>
      
      <div className="w-full max-w-md z-10">
        {/* Back to home link */}
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-slate-400 hover:text-primary transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Zpět na hlavní stránku
        </Link>

        {/* Header Section - No Card Container */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary via-primary/80 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/50 backdrop-blur-sm border border-primary/30">
            <div className="text-4xl">🛡️</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-3 text-white">
            Vítejte zpět
          </h1>
          <p className="text-slate-300 text-lg">
            Přihlaste se pomocí Bakaláři
          </p>
        </div>

        {/* Form Container - Pure, clean, no borders */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 backdrop-blur-sm">
              <p className="text-red-200 text-sm font-medium">{error}</p>
            </div>
          )}
          
          {/* Username Field */}
          <div className="space-y-2.5">
            <Label htmlFor="username" className="text-slate-300 text-sm font-semibold block">
              Uživatelské jméno
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Zadejte uživatelské jméno"
              required
              disabled={isLoading}
              className="w-full h-12 px-4 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder:text-slate-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-sm"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-slate-300 text-sm font-semibold block">
              Heslo
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Zadejte heslo"
              required
              disabled={isLoading}
              className="w-full h-12 px-4 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder:text-slate-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-sm"
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 mt-8 text-base font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-lg shadow-lg shadow-primary/50 transition-all hover:shadow-xl hover:shadow-primary/60"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Vstupování...
              </>
            ) : (
              <>
                Pokračovat do dobrodružství
                <span className="ml-2">→</span>
              </>
            )}
          </Button>
        </form>

        {/* Info Section */}
        <div className="mt-12 pt-8 border-t border-slate-700/50 text-center text-xs text-slate-400">
          <p>
            🔐 Bezpečné přihlášení přes Bakaláři API
            <br />
            Vaše data se neukládají
          </p>
        </div>
      </div>
    </div>
  )
}
      </div>
    </div>
  )
}
