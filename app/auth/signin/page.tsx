"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[url('/images/grid-pattern.png')] bg-repeat"></div>
      
      <div className="w-full max-w-md z-10">
        {/* Back to home link */}
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na hlavní stránku
        </Link>

        <Card className="shadow-xl border-primary/20">
          <CardHeader className="text-center border-b border-border/50 pb-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
               <div className="w-8 h-8 text-primary">🛡️</div>
            </div>
            <CardTitle className="text-2xl font-bold text-primary font-heading">
              Vítejte v EduRPG
            </CardTitle>
            <CardDescription>
              Přihlaste se pomocí svých Bakaláři přihlašovacích údajů
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Uživatelské jméno</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Zadejte své Bakaláři uživatelské jméno"
                  required
                  disabled={isLoading}
                  className="rpg-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Zadejte své Bakaláři heslo"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
                variant="rpg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vstupování do světa...
                  </>
                ) : (
                  "Vstoupit do světa"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                Používáme Bakaláři API pro bezpečné přihlášení.
                <br />
                Vaše údaje se nikdy neukládají v naší databázi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
