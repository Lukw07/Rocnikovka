import { useState, useCallback } from "react"

interface XPData {
  totalXP: number
  level: number
  progressToNextLevel: number
  xpForNextLevel: number
  xpNeededForNextLevel: number
  streak: {
    currentStreak: number
    maxStreak: number
    multiplier: number
    totalParticipation: number
  }
}

interface XPSource {
  type: string
  count: number
  totalXP: number
  bonusXP: number
}

interface XPBreakdownResponse {
  studentId: string
  daysBack: number
  breakdown: XPSource[]
  summary: {
    totalXP: number
    totalBonusXP: number
    sourceCount: number
    activityCount: number
  }
}

interface StreakResponse {
  studentId: string
  currentStreak: number
  maxStreak: number
  xpMultiplier: number
  totalParticipation: number
  lastActivityDate: string | null
  streakBrokenAt: string | null
  isActive: boolean
}

/**
 * Hook for fetching XP-related data from the API
 */
export function useXPData(studentId?: string) {
  const [xpData, setXpData] = useState<XPData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchXP = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (studentId) params.append('studentId', studentId)
      
      const response = await fetch(`/api/xp/student?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch XP data')
      }
      
      const data = await response.json()
      setXpData(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [studentId])
  
  return { xpData, loading, error, fetchXP }
}

/**
 * Hook for fetching XP sources breakdown
 */
export function useXPSources(studentId?: string, daysBack: number = 30) {
  const [sources, setSources] = useState<XPBreakdownResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchSources = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (studentId) params.append('studentId', studentId)
      params.append('daysBack', daysBack.toString())
      
      const response = await fetch(`/api/xp/sources?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch XP sources')
      }
      
      const data = await response.json()
      setSources(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [studentId, daysBack])
  
  return { sources, loading, error, fetchSources }
}

/**
 * Hook for fetching streak information
 */
export function useStreak(studentId?: string) {
  const [streak, setStreak] = useState<StreakResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchStreak = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (studentId) params.append('studentId', studentId)
      
      const response = await fetch(`/api/xp/streaks?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch streak data')
      }
      
      const data = await response.json()
      setStreak(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [studentId])
  
  return { streak, loading, error, fetchStreak }
}
