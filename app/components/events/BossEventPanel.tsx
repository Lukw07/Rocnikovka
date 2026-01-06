'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Progress } from '@/app/components/ui/progress'
import { Badge } from '@/app/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { toast } from 'sonner'
import { Flame, Users, Sword } from 'lucide-react'

interface BossEvent {
  id: string
  name: string
  description?: string
  maxHp: number
  currentHp: number
  level: number
  isDefeated: boolean
  participants: Array<{
    userId: string
    user: { id: string; name: string }
    totalDamage: number
    attackCount: number
  }>
  attacks: Array<{
    id: string
    userId: string
    damage: number
    message?: string
    attackedAt: string
  }>
}

interface Props {
  eventId: string
}

export function BossEventPanel({ eventId }: Props) {
  const [bossEvent, setBossEvent] = useState<BossEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [attacking, setAttacking] = useState(false)
  const hpPercent = bossEvent ? (bossEvent.currentHp / bossEvent.maxHp) * 100 : 0

  useEffect(() => {
    fetchBossEvent()
    const interval = setInterval(fetchBossEvent, 5000) // Refresh každých 5 sekund
    return () => clearInterval(interval)
  }, [eventId])

  const fetchBossEvent = async () => {
    try {
      const res = await fetch(`/api/events/boss?eventId=${eventId}`)
      if (res.ok) {
        const data = await res.json()
        setBossEvent(data.data?.bossEvent)
      }
    } catch (error) {
      console.error('Error fetching boss event')
    } finally {
      setLoading(false)
    }
  }

  const handleAttack = async () => {
    if (!bossEvent) return

    try {
      setAttacking(true)
      const res = await fetch('/api/events/boss/attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bossEventId: bossEvent.id,
          damage: Math.floor(Math.random() * 5) + 1 // 1-5 damage
        })
      })

      if (res.ok) {
        const data = await res.json()
        
        if (data.data?.bossState?.isDefeated) {
          toast.success('Boss poražen! 🎉', {
            description: 'Všichni účastníci získali odměny!'
          })
        } else {
          toast.success('Útok zaregistrován!', {
            description: `Damage: ${data.data?.attack?.damage}, Boss HP: ${data.data?.bossState?.currentHp}/${data.data?.bossState?.maxHp}`
          })
        }
        
        fetchBossEvent()
      }
    } catch (error) {
      toast.error('Chyba při útoku')
    } finally {
      setAttacking(false)
    }
  }

  if (loading) {
    return <Card><CardContent className="pt-6">Načítání boss eventu...</CardContent></Card>
  }

  if (!bossEvent) {
    return <Card><CardContent className="pt-6">Boss event není dostupný</CardContent></Card>
  }

  return (
    <Card className={bossEvent.isDefeated ? 'border-green-500' : 'border-red-500'}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              {bossEvent.name}
            </CardTitle>
            <CardDescription>{bossEvent.description}</CardDescription>
          </div>
          {bossEvent.isDefeated && (
            <Badge variant="default" className="bg-green-600">Poražen!</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Boss HP */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">HP</span>
            <span>{bossEvent.currentHp} / {bossEvent.maxHp}</span>
          </div>
          <Progress 
            value={hpPercent} 
            className="h-3"
          />
          <p className="text-xs text-muted-foreground">Level {bossEvent.level}</p>
        </div>

        {/* Attack Button */}
        {!bossEvent.isDefeated && (
          <Button
            onClick={handleAttack}
            disabled={attacking}
            size="lg"
            className="w-full"
            variant="destructive"
          >
            <Sword className="w-4 h-4 mr-2" />
            {attacking ? 'Útočím...' : 'Zaútočit'}
          </Button>
        )}

        {/* Leaderboard */}
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Top účastníci
          </h3>
          <div className="space-y-2">
            {bossEvent.participants.slice(0, 5).map((p, idx) => (
              <div key={p.userId} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{idx + 1}.</Badge>
                  <span className="text-sm font-medium">{p.user.name}</span>
                </div>
                <div className="text-right text-xs">
                  <p className="text-muted-foreground">{p.totalDamage} DMG</p>
                  <p className="text-muted-foreground">{p.attackCount} útoků</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attacks */}
        {bossEvent.attacks.length > 0 && (
          <div className="mt-4 space-y-2 text-xs">
            <p className="text-muted-foreground">Poslední útoky:</p>
            {bossEvent.attacks.slice(0, 3).map(a => (
              <p key={a.id} className="text-muted-foreground">
                • {a.damage} DMG
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
