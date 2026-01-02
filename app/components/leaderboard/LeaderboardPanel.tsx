"use client"

import React, { useEffect, useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSidebar } from "@/app/components/ui/Sidebar"
import { Button } from "@/app/components/ui/button"
import { Trophy, User, ArrowLeft, Filter, Sparkles, Crown, Star, Award, Users, GraduationCap } from "lucide-react"
import { UserProfileHoverCard } from "@/app/components/shared/UserProfileHoverCard"
import { UserAvatarWithBadge } from "@/app/components/dashboard/UserAvatarWithBadge"

import { ItemRarity } from "@/app/lib/generated"

type LeaderboardRow = {
  id: string
  name: string
  totalXP: number
  level: number
  progressToNextLevel: number
  class: string
  grade: number
  classId: string
  avatarUrl?: string | null
  badgeRarity?: ItemRarity | null
}

type UserData = {
  id: string
  name: string
  classId: string
  className: string
  grade: number
  totalXP: number
  level: number
}

export default function LeaderboardPanel() {
  const { setSelectedPanel } = useSidebar()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [showOnlyMyClass, setShowOnlyMyClass] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [currentUserPosition, setCurrentUserPosition] = useState<number | null>(null)

  // Načtení dat z jediného API endpointu
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const filterType = showOnlyMyClass ? 'class' : 'grade'
        const res = await fetch(`/api/leaderboard?filterType=${filterType}`)
        
        if (!res.ok) {
          throw new Error('Failed to fetch leaderboard data')
        }

        const data = await res.json()
        
        // Nastavíme všechna data najednou
        setLeaderboard(data.leaderboard || [])
        setUserData(data.userData || null)
        setCurrentUserPosition(data.currentUserPosition || null)
        
      } catch (error) {
        setLeaderboard([])
        setUserData(null)
        setCurrentUserPosition(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [showOnlyMyClass])

  // Seřazení leaderboardu podle XP
  const leaderboardWithPositions = useMemo(() => {
    return [...leaderboard].sort((a, b) => b.totalXP - a.totalXP)
  }, [leaderboard])

  // Rozdělení do sekcí - pro třídu zobrazíme všechny, pro ročník pouze top 20
  const eliteGroup = useMemo(() => 
    leaderboardWithPositions.slice(0, 3), 
    [leaderboardWithPositions]
  )

  const championsGroup = useMemo(() => 
    leaderboardWithPositions.slice(3, 10), 
    [leaderboardWithPositions]
  )

  const risingStarsGroup = useMemo(() => 
    leaderboardWithPositions.slice(10, 20), 
    [leaderboardWithPositions]
  )

  const restOfGroup = useMemo(() => 
    showOnlyMyClass ? leaderboardWithPositions.slice(20) : [],
    [leaderboardWithPositions, showOnlyMyClass]
  )

  // Helper funkce pro texty
  const getGradeText = useCallback((grade: number) => {
    const gradeTexts: { [key: number]: string } = {
      1: "prvního",
      2: "druhého", 
      3: "třetího",
      4: "čtvrtého",
    }
    return gradeTexts[grade] || `${grade}.`
  }, [])

  const getCurrentViewTitle = useCallback(() => {
    if (!userData) return "Načítání..."
    if (showOnlyMyClass) {
      return `Třída ${userData.className}`
    } else {
      return `${userData.grade}. ročník`
    }
  }, [showOnlyMyClass, userData])

  const getFilterDescription = useCallback(() => {
    if (!userData) return "Načítání..."
    if (showOnlyMyClass) {
      if (userData.grade > 0) {
        return `Zobrazeni pouze žáci ${getGradeText(userData.grade)} ročníku z třídy ${userData.className}`
      }
      return `Zobrazeni pouze žáci třídy ${userData.className}`
    } else {
      return `Zobrazeni nejlepších 20 žáků ${getGradeText(userData.grade)} ročníku`
    }
  }, [showOnlyMyClass, userData, getGradeText])

  const getEmptyStateText = useCallback(() => {
    if (!userData) return "Načítání..."
    if (showOnlyMyClass) {
      return `Ve třídě ${userData.className} zatím nikdo nezískal XP`
    } else {
      return `V ${userData.grade}. ročníku zatím nikdo nezískal XP`
    }
  }, [showOnlyMyClass, userData])

  // Funkce pro přepnutí filtru s kontrolou dostupnosti dat
  const handleFilterChange = useCallback((showClass: boolean) => {
    if (showClass && !userData?.classId) {
      
      return
    }
    if (!showClass && (!userData?.grade || userData.grade === 0)) {
      
      return
    }
    setShowOnlyMyClass(showClass)
  }, [userData])

  // Funkce pro získání ikony a barvy podle pozice
  const getPositionStyle = useCallback((position: number) => {
    switch(position) {
      case 1:
        return {
          icon: Crown,
          bgColor: "from-yellow-50/80 to-amber-50/80",
          borderColor: "border-amber-200",
          textColor: "text-amber-900",
          iconColor: "text-amber-600",
          badgeColor: "bg-amber-100",
          positionColor: "text-yellow-600"
        }
      case 2:
        return {
          icon: Crown,
          bgColor: "from-gray-50/80 to-slate-50/80",
          borderColor: "border-slate-200",
          textColor: "text-slate-900",
          iconColor: "text-slate-600",
          badgeColor: "bg-slate-100",
          positionColor: "text-gray-600"
        }
      case 3:
        return {
          icon: Crown,
          bgColor: "from-orange-50/80 to-amber-50/80",
          borderColor: "border-orange-200",
          textColor: "text-orange-900",
          iconColor: "text-orange-600",
          badgeColor: "bg-orange-100",
          positionColor: "text-orange-600"
        }
      default:
        return {
          icon: Crown,
          bgColor: "from-amber-50/80 to-yellow-50/80",
          borderColor: "border-amber-100",
          textColor: "text-amber-900",
          iconColor: "text-amber-600",
          badgeColor: "bg-amber-100",
          positionColor: "text-amber-600"
        }
    }
  }, [])

  // Loading state
  if (loading && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Načítání dat...</p>
        </div>
      </div>
    )
  }

  // Error state - pokud nemáme userData po načtení
  if (!loading && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Nepodařilo se načíst data</p>
          <p className="text-sm text-muted-foreground">Zkuste obnovit stránku</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Obnovit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-6">
      <div className="max-w mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSelectedPanel("dashboard")}
              className="rounded-full h-10 w-10 shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Školní žebříček
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {getCurrentViewTitle()}
                {currentUserPosition && ` • Tvá pozice: #${currentUserPosition}`}
              </p>
            </div>
          </div>
          
          {/* Current User Position */}
          {currentUserPosition && userData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl border shadow-sm"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tvá pozice</div>
                <div className="text-xl font-bold text-primary">#{currentUserPosition}</div>
              </div>
              <div className="border-l pl-4">
                <div className="text-sm text-muted-foreground">Level</div>
                <div className="text-xl font-bold">{userData.level}</div>
              </div>
              <div className="border-l pl-4">
                <div className="text-sm text-muted-foreground">XP</div>
                <div className="text-xl font-bold">{userData.totalXP}</div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Filtry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Zobrazit žebříček
              </h3>
              <p className="text-sm text-muted-foreground">
                {getFilterDescription()}
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={showOnlyMyClass ? "default" : "outline"}
                onClick={() => handleFilterChange(true)}
                className="min-w-[160px]"
                disabled={!userData?.classId}
              >
                <Users className="w-4 h-4 mr-2" />
                Pouze moje třída
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={!showOnlyMyClass ? "default" : "outline"}
                onClick={() => handleFilterChange(false)}
                className="min-w-[160px]"
                disabled={!userData?.grade || userData?.grade === 0}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Celý {userData?.grade || '?'}. ročník
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Hlavní obsah */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="space-y-4"
              >
                <div className="h-8 bg-muted rounded-lg animate-pulse"></div>
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-20 bg-muted rounded-xl animate-pulse"></div>
                ))}
              </motion.div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 text-muted-foreground"
          >
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Žádná data k zobrazení</p>
            <p className="text-sm">
              {getEmptyStateText()}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Elite Group - Top 3 */}
            {eliteGroup.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-bold mb-6 flex items-center gap-3"
                >
                  <div className="p-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg shadow-lg">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                    Elitní Skupina - {getCurrentViewTitle()}
                  </span>
                </motion.h3>
                
                <div className="space-y-4">
                  {eliteGroup.map((row, index) => {
                    const position = index + 1
                    const style = getPositionStyle(position)
                    const IconComponent = style.icon
                    
                    return (
                      <motion.div
                        key={row.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-xl border-2 bg-gradient-to-br ${style.bgColor} backdrop-blur-sm shadow-sm relative ${
                          row.id === userData?.id 
                            ? "ring-2 ring-amber-300 " + style.borderColor
                            : style.borderColor
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`text-2xl font-bold ${style.positionColor} min-w-[40px] text-center`}>
                              #{position}
                            </div>
                            <div className={`p-3 ${style.badgeColor} rounded-xl`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <UserProfileHoverCard userId={row.id} name={row.name}>
                              <div className="flex items-center gap-3 cursor-pointer">
                                <UserAvatarWithBadge name={row.name} className="h-12 w-12" avatarUrl={row.avatarUrl} badgeRarity={row.badgeRarity} level={row.level} />
                                <div>
                                  <div className={`font-bold text-lg ${style.textColor} hover:underline`}>{row.name}</div>
                                  <div className={`text-sm ${style.textColor} opacity-80`}>Level {row.level} • {row.class}</div>
                                </div>
                              </div>
                            </UserProfileHoverCard>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${style.textColor}`}>{row.totalXP} XP</div>
                          </div>
                        </div>
                        {row.id === userData?.id && (
                          <div className="flex justify-end mt-2">
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-full text-xs text-amber-700">
                              <User className="w-3 h-3" />
                              Ty
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            )}

            {/* Champions Group - 4-10 */}
            {championsGroup.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <motion.h3 
                  className="text-xl font-bold mb-4 flex items-center gap-3"
                >
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Šampióni (4. - 10.)
                  </span>
                </motion.h3>
                
                <div className="space-y-3">
                  {championsGroup.map((row, index) => {
                    const position = index + 4
                    return (
                      <motion.div
                        key={row.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index + 3) * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-xl border bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm shadow-sm ${
                          row.id === userData?.id 
                            ? "ring-2 ring-blue-300 border-blue-200" 
                            : "border-blue-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-bold text-blue-600 min-w-[32px]">#{position}</div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Star className="w-4 h-4 text-blue-600" />
                            </div>
                            <UserProfileHoverCard userId={row.id} name={row.name}>
                              <div className="flex items-center gap-3 cursor-pointer">
                                <UserAvatarWithBadge name={row.name} className="h-12 w-12" avatarUrl={row.avatarUrl} badgeRarity={row.badgeRarity} level={row.level} />
                                <div>
                                  <div className="font-semibold text-blue-900 hover:underline">{row.name}</div>
                                  <div className="text-sm text-blue-700">Level {row.level} • {row.class}</div>
                                </div>
                              </div>
                            </UserProfileHoverCard>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-900">{row.totalXP} XP</div>
                          </div>
                        </div>
                        {row.id === userData?.id && (
                          <div className="flex justify-end mt-2">
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-full text-xs text-blue-700">
                              <User className="w-3 h-3" />
                              Ty
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            )}

            {/* Rising Stars Group - 11-20 */}
            {risingStarsGroup.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.h3 
                  className="text-xl font-bold mb-4 flex items-center gap-3"
                >
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Nastupující Hvězdy (11. - 20.)
                  </span>
                </motion.h3>
                
                <div className="space-y-3">
                  {risingStarsGroup.map((row, index) => {
                    const position = index + 11
                    return (
                      <motion.div
                        key={row.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index + 10) * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        className={`p-3 rounded-lg border bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm ${
                          row.id === userData?.id 
                            ? "ring-1 ring-green-300 border-green-200" 
                            : "border-green-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-green-600 min-w-[28px]">#{position}</div>
                            <div className="p-1 bg-green-100 rounded-md">
                              <Award className="w-3 h-3 text-green-600" />
                            </div>
                            <UserProfileHoverCard userId={row.id} name={row.name}>
                              <div className="flex items-center gap-2 cursor-pointer">
                                <UserAvatarWithBadge name={row.name} className="h-10 w-10" avatarUrl={row.avatarUrl} badgeRarity={row.badgeRarity} level={row.level} />
                                <div>
                                  <div className="font-medium text-green-900 text-sm hover:underline">{row.name}</div>
                                  <div className="text-xs text-green-700">Level {row.level} • {row.class}</div>
                                </div>
                              </div>
                            </UserProfileHoverCard>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-green-900">{row.totalXP} XP</div>
                          </div>
                        </div>
                        {row.id === userData?.id && (
                          <div className="flex justify-end mt-1">
                            <div className="inline-flex items-center gap-1 px-1 py-0.5 bg-green-500/20 rounded-full text-xs text-green-700">
                              <User className="w-2 h-2" />
                              Ty
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            )}

            {/* Zbytek leaderboardu - pouze pro třídu */}
            {showOnlyMyClass && restOfGroup.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <motion.h3 
                  className="text-xl font-bold mb-4 flex items-center gap-3"
                >
                  <div className="p-2 bg-gradient-to-r from-slate-500 to-gray-600 rounded-lg shadow-lg">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
                    Zbytek třídy
                  </span>
                </motion.h3>
                
                <div className="space-y-2">
                  {restOfGroup.map((row, index) => {
                    const position = index + 21
                    return (
                      <motion.div
                        key={row.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index + 20) * 0.03 }}
                        whileHover={{ scale: 1.01 }}
                        className={`p-3 rounded-lg border bg-white/60 backdrop-blur-sm ${
                          row.id === userData?.id 
                            ? "ring-1 ring-primary border-primary/20 bg-primary/5" 
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-gray-600 min-w-[28px]">#{position}</div>
                            <div className="p-1 bg-gray-100 rounded-md">
                              <User className="w-3 h-3 text-gray-600" />
                            </div>
                            <UserProfileHoverCard userId={row.id} name={row.name}>
                              <div className="flex items-center gap-2 cursor-pointer">
                                <UserAvatarWithBadge name={row.name} className="h-10 w-10" avatarUrl={row.avatarUrl} badgeRarity={row.badgeRarity} level={row.level} />
                                <div>
                                  <div className="font-medium text-gray-900 text-sm hover:underline">{row.name}</div>
                                  <div className="text-xs text-gray-600">Level {row.level} • {row.class}</div>
                                </div>
                              </div>
                            </UserProfileHoverCard>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">{row.totalXP} XP</div>
                          </div>
                        </div>
                        {row.id === userData?.id && (
                          <div className="flex justify-end mt-1">
                            <div className="inline-flex items-center gap-1 px-1 py-0.5 bg-primary/20 rounded-full text-xs text-primary-700">
                              <User className="w-2 h-2" />
                              Ty
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            )}
          </div>
        )}

        {/* User not in top sections */}
        {userData && currentUserPosition && currentUserPosition > 20 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 sticky bottom-6 z-50 shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Tvá pozice v žebříčku</h3>
                  <p className="text-sm text-muted-foreground">
                    #{currentUserPosition} • {userData.name} • Level {userData.level}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{userData.totalXP} XP</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}