"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Loader2, Sword, Trophy, Users, ArrowRight, ArrowLeft, Sparkles, Shield, Flower, Sun, Leaf, Snowflake, Castle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Kompletní barevná schémata s obrázky na pozadí a lepšími glass efekty
const THEMES = {
  spring: {
    name: "Jaro",
    primary: "bg-emerald-500",
    gradient: "from-emerald-500 to-green-500",
    backgroundImage: "url('/Spring-bg.png')",
    glass: "bg-white/10 backdrop-blur-md border border-white/20",
    card: "bg-black/20 backdrop-blur-md border border-white/10",
    text: "text-white",
    textMuted: "text-white/80",
    border: "border-white/20",
    icon: Flower
  },
  summer: {
    name: "Léto",
    primary: "bg-blue-500",
    gradient: "from-blue-500 to-cyan-500",
    backgroundImage: "url('/Summer-bg.png')",
    glass: "bg-white/10 backdrop-blur-md border border-white/20",
    card: "bg-black/20 backdrop-blur-md border border-white/10",
    text: "text-white",
    textMuted: "text-white/80",
    border: "border-white/20",
    icon: Sun
  },
  autumn: {
    name: "Podzim",
    primary: "bg-amber-500",
    gradient: "from-amber-500 to-orange-500",
    backgroundImage: "url('/Autumn-bg.jpg')",
    glass: "bg-white/10 backdrop-blur-md border border-white/20",
    card: "bg-black/20 backdrop-blur-md border border-white/10",
    text: "text-white",
    textMuted: "text-white/80",
    border: "border-white/20",
    icon: Leaf
  },
  winter: {
    name: "Zima",
    primary: "bg-indigo-500",
    gradient: "from-indigo-500 to-purple-500",
    backgroundImage: "url('/Winter-bg.png')",
    glass: "bg-white/10 backdrop-blur-md border border-white/20",
    card: "bg-black/20 backdrop-blur-md border border-white/10",
    text: "text-white",
    textMuted: "text-white/80",
    border: "border-white/20",
    icon: Snowflake
  }
}

type Theme = keyof typeof THEMES

const ANIMATION = {
  fast: { duration: 0.2 },
  spring: { type: "spring" as const, stiffness: 400, damping: 30 }
}

export default function HomePage() {
  const [showLogin, setShowLogin] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginDots, setLoginDots] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [animateAway, setAnimateAway] = useState(false)
  const [usernameFocused, setUsernameFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<Theme>("spring")
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  const THEME = THEMES[currentTheme]

  useEffect(() => {
    setMounted(true)
  }, [])

  // animate the "Přihlašování." dots while loading
  useEffect(() => {
    if (!isLoading) {
      setLoginDots("")
      return
    }

    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % 4
      setLoginDots(".".repeat(i))
    }, 400)

    return () => clearInterval(interval)
  }, [isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Nesprávné uživatelské jméno nebo heslo. Zkontrolujte své Bakaláři přihlašovací údaje.')
        setIsLoading(false)
      } else if (result?.ok) {
        // success animation: show success state, then animate away and redirect
        setIsSuccess(true)
        // give user a short moment to see success then animate away
        setTimeout(() => setAnimateAway(true), 150)
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 600)
      }
    } catch (error) {
      setError("Nastala neočekávaná chyba. Zkuste to znovu.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div 
      className="min-h-screen transition-all duration-300 relative overflow-hidden"
      style={{
        backgroundImage: THEME.backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      
      {/* Hlavní obsah */}
      <div className="relative z-10">
        {/* Header */}
        <header className="relative z-10">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center space-x-3 ${THEME.glass} rounded-2xl px-4 py-3 shadow-lg`}
              >
                <div className={`p-2 rounded-lg ${THEME.primary} text-white shadow-md`}>
                  <Castle className="w-6 h-6" />
                </div>
                <span className={`text-xl font-bold ${THEME.text} drop-shadow-md`}>EduRPG</span>
              </motion.div>

              {/* Theme Selector */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex space-x-1 ${THEME.glass} rounded-2xl p-2 shadow-lg`}
              >
                {(Object.entries(THEMES) as [Theme, typeof THEMES[Theme]][]).map(([theme, config]) => (
                  <button
                    key={theme}
                    onClick={() => setCurrentTheme(theme)}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      currentTheme === theme 
                        ? `bg-white/30 text-white shadow-sm` 
                        : "text-white/70 hover:text-white hover:bg-white/20"
                    }`}
                  >
                    <config.icon className="w-4 h-4" />
                  </button>
                ))}
              </motion.div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!showLogin ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="container mx-auto px-4 py-8 sm:py-12"
            >
              {/* Hero Section */}
              <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-20">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className={`inline-flex items-center space-x-2 ${THEME.glass} rounded-full px-4 py-2 mb-6 sm:mb-8 shadow-lg`}
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className={`text-sm font-medium ${THEME.textMuted}`}>
                    Revoluce ve vzdělávání
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className={`text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 ${THEME.text} drop-shadow-2xl`}
                >
                  Vzdělávání jako
                  <span className={`block bg-gradient-to-r ${THEME.gradient} bg-clip-text text-transparent drop-shadow-sm`}>
                    dobrodružství
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className={`text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 leading-relaxed ${THEME.text} drop-shadow-lg max-w-2xl mx-auto`}
                >
                  Získejte zkušenosti, plňte mise a staňte se legendou ve světě vzdělávání
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                  <Button
                    onClick={() => setShowLogin(true)}
                    className={`bg-gradient-to-r ${THEME.gradient} hover:opacity-90 text-white px-6 sm:px-8 py-5 sm:py-6 text-lg rounded-xl transition-all duration-200 transform hover:-translate-y-1 shadow-lg border border-white/20 font-semibold`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>Začít dobrodružství</span>
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Button>
                </motion.div>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-20 max-w-2xl mx-auto"
              >
                {[
                  { number: "500+", label: "Aktivních studentů" },
                  { number: "1.2k", label: "Splněných misí" },
                  { number: "50+", label: "Odměn k získání" },
                  { number: "99%", label: "Spokojených uživatelů" }
                ].map((stat, index) => (
                  <div key={stat.label} className="text-center">
                    <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${THEME.text} mb-1 sm:mb-2 drop-shadow-lg`}>
                      {stat.number}
                    </div>
                    <div className={`text-xs sm:text-sm ${THEME.textMuted} drop-shadow-md`}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-20"
              >
                {[
                  {
                    icon: Sword,
                    title: "Bojujte s výzvami",
                    description: "Přeměňte úkoly na dobrodružství a získejte XP za každý splněný úkol"
                  },
                  {
                    icon: Trophy,
                    title: "Sbírejte trofeje",
                    description: "Odemykejte úspěchy a sbírejte odznaky za své vzdělávací úspěchy"
                  },
                  {
                    icon: Users,
                    title: "Soupeřte s přáteli",
                    description: "Zapojte se do žebříčku a ukažte, kdo je nejlepší ve třídě"
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className={`p-4 sm:p-6 rounded-2xl ${THEME.card} border shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-md`}
                  >
                    <div className={`inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-r ${THEME.gradient} text-white mb-3 sm:mb-4 shadow-lg`}>
                      <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className={`font-bold text-lg sm:text-xl mb-2 sm:mb-3 ${THEME.text} drop-shadow-md`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm sm:text-base ${THEME.textMuted} drop-shadow-sm`}>
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={animateAway ? 
                { opacity: 0, scale: 1.1, y: -1000, rotate: 5 } : 
                { opacity: 1, scale: 1 }
              }
              exit={{ opacity: 0, scale: 1.05 }}
              transition={ANIMATION.spring}
              className="flex items-center justify-center min-h-[70vh] sm:min-h-[80vh] px-4"
            >
              <div className="w-full max-w-md">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setShowLogin(false)}
                  className={`inline-flex items-center text-sm mb-6 ${THEME.textMuted} hover:text-white transition-all duration-200 group ${THEME.glass} rounded-xl px-4 py-2 shadow-lg`}
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                  Zpět na úvod
                </motion.button>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <Card className={`${THEME.card} border backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden`}>
                    <CardHeader className="text-center space-y-4 pb-6">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="space-y-3"
                      >
                        <div className={`inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-r ${THEME.gradient} text-white mx-auto shadow-lg`}>
                          <Shield className="w-6 h-6" />
                        </div>
                        <CardTitle className={`text-2xl font-bold ${THEME.text} drop-shadow-md`}>
                          Vítejte zpět
                        </CardTitle>
                        <CardDescription className={`text-base ${THEME.textMuted} drop-shadow-sm`}>
                          Přihlaste se pomocí Bakaláři účtu
                        </CardDescription>
                      </motion.div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Alert className="bg-red-500/30 backdrop-blur-md border-red-400/40 text-white rounded-xl">
                                <AlertDescription className="text-sm drop-shadow-sm">
                                  {error}
                                </AlertDescription>
                              </Alert>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <div className="space-y-4">
                          <Label htmlFor="username" className={`text-sm font-medium ${THEME.text} drop-shadow-sm`}>
                            Uživatelské jméno
                          </Label>
                          <motion.div
                            initial={false}
                            animate={usernameFocused ? { scale: 1.02 } : { scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Input
                              id="username"
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              onFocus={() => setUsernameFocused(true)}
                              onBlur={() => setUsernameFocused(false)}
                              placeholder="Zadejte své Bakaláři uživatelské jméno"
                              required
                              disabled={isLoading}
                              className={`rounded-lg bg-white/20 backdrop-blur-md border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:border-white/50 transition-all duration-200 font-medium`}
                            />
                          </motion.div>
                        </div>

                        <div className="space-y-4">
                          <Label htmlFor="password" className={`text-sm font-medium ${THEME.text} drop-shadow-sm`}>
                            Heslo
                          </Label>
                          <motion.div
                            initial={false}
                            animate={passwordFocused ? { scale: 1.02 } : { scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Input
                              id="password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onFocus={() => setPasswordFocused(true)}
                              onBlur={() => setPasswordFocused(false)}
                              placeholder="Zadejte své Bakaláři heslo"
                              required
                              disabled={isLoading}
                              className={`rounded-lg bg-white/20 backdrop-blur-md border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:border-white/50 transition-all duration-200 font-medium`}
                            />
                          </motion.div>
                        </div>

                        <Button 
                          type="submit" 
                          className={`w-full bg-gradient-to-r ${THEME.gradient} hover:opacity-90 text-white py-6 rounded-xl transition-all duration-200 flex items-center justify-center border border-white/20 shadow-lg font-semibold`}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center space-x-3">
                              <Loader2 className="w-5 h-5 mr-1 animate-spin" />
                              <motion.span
                                key={loginDots}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="font-medium"
                              >
                                Přihlašování{loginDots}
                              </motion.span>
                            </div>
                          ) : isSuccess ? (
                            <motion.span 
                              initial={{ scale: 0.9 }} 
                              animate={{ scale: 1 }} 
                              className="font-medium"
                            >
                              Vítejte!
                            </motion.span>
                          ) : (
                            <span className="flex items-center justify-center space-x-2">
                              <span>Pokračovat do dobrodružství</span>
                              <ArrowRight className="w-5 h-5" />
                            </span>
                          )}
                        </Button>
                      </form>

                      <div className={`text-center text-xs ${THEME.textMuted} space-y-2 pt-4 border-t border-white/20 drop-shadow-sm`}>
                        <p>Používáme Bakaláři API pro bezpečné přihlášení.</p>
                        <p>Vaše údaje se nikdy neukládají v naší databázi.</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}