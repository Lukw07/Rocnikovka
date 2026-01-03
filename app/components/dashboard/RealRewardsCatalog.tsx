"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { Textarea } from "@/app/components/ui/textarea"
import { Label } from "@/app/components/ui/label"
import { Gift, Clock, Sparkles, ShoppingBag, Award, CheckCircle2, XCircle, Loader2, Calendar } from "lucide-react"
import { toast } from "sonner"

interface RealLifeReward {
  id: string
  name: string
  description: string
  category: string
  imageUrl?: string
  goldPrice: number
  gemsPrice: number
  levelRequired: number
  availableStock: number
  totalStock: number
  isLimited: boolean
  isFeatured: boolean
  availableFrom?: string
  availableTo?: string
}

interface RewardClaim {
  id: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED"
  goldPaid: number
  gemsPaid: number
  studentNote?: string
  adminNote?: string
  rejectedReason?: string
  createdAt: string
  reward: RealLifeReward
}

interface RealRewardsCatalogProps {
  studentId: string
  studentGold: number
  studentGems: number
  studentLevel: number
}

export function RealRewardsCatalog({ studentId, studentGold, studentGems, studentLevel }: RealRewardsCatalogProps) {
  const [rewards, setRewards] = useState<RealLifeReward[]>([])
  const [myClaims, setMyClaims] = useState<RewardClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [selectedReward, setSelectedReward] = useState<RealLifeReward | null>(null)
  const [studentNote, setStudentNote] = useState("")
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    loadRewards()
    loadMyClaims()
  }, [studentId])

  const loadRewards = async () => {
    try {
      const response = await fetch(`/api/real-rewards?studentId=${studentId}`)
      const data = await response.json()
      if (data.success) {
        setRewards(data.data.rewards)
      }
    } catch (error) {
      console.error("Failed to load rewards:", error)
      toast.error("Nepodařilo se načíst odměny")
    } finally {
      setLoading(false)
    }
  }

  const loadMyClaims = async () => {
    try {
      const response = await fetch("/api/real-rewards/claims")
      const data = await response.json()
      if (data.success) {
        setMyClaims(data.data.claims)
      }
    } catch (error) {
      console.error("Failed to load claims:", error)
    }
  }

  const handleClaimReward = async () => {
    if (!selectedReward) return

    setClaiming(true)
    try {
      const response = await fetch("/api/real-rewards/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId: selectedReward.id,
          studentNote: studentNote || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Odměna úspěšně žádána! Čeká na schválení.")
        setClaimDialogOpen(false)
        setStudentNote("")
        setSelectedReward(null)
        loadRewards()
        loadMyClaims()
      } else {
        toast.error(data.error || "Nepodařilo se získat odměnu")
      }
    } catch (error) {
      console.error("Failed to claim reward:", error)
      toast.error("Chyba při žádosti o odměnu")
    } finally {
      setClaiming(false)
    }
  }

  const canAfford = (reward: RealLifeReward) => {
    if (reward.goldPrice > 0 && studentGold < reward.goldPrice) return false
    if (reward.gemsPrice > 0 && studentGems < reward.gemsPrice) return false
    return true
  }

  const isEligible = (reward: RealLifeReward) => {
    return studentLevel >= reward.levelRequired && canAfford(reward)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "FOOD": return "🍕"
      case "ENTERTAINMENT": return "🎬"
      case "SCHOOL_PERKS": return "🎓"
      case "MERCHANDISE": return "👕"
      case "GIFT_CARD": return "🎁"
      case "EVENT_TICKET": return "🎟️"
      default: return "⭐"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">⏳ Čeká na schválení</Badge>
      case "APPROVED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">✅ Schváleno</Badge>
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">🎉 Předáno</Badge>
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">❌ Zamítnuto</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Gift className="w-8 h-8" />
            Reálné odměny
          </CardTitle>
          <CardDescription className="text-white/90">
            Získej skutečné odměny za své herní úspěchy!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="bg-white/20 rounded-lg p-3 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-xs opacity-80">Zlato</p>
                <p className="text-lg font-bold">{studentGold}</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 flex items-center gap-2">
              <span className="text-2xl">💎</span>
              <div>
                <p className="text-xs opacity-80">Diamanty</p>
                <p className="text-lg font-bold">{studentGems}</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="text-xs opacity-80">Level</p>
                <p className="text-lg font-bold">{studentLevel}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catalog">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Katalog odměn
          </TabsTrigger>
          <TabsTrigger value="my-claims">
            <Award className="w-4 h-4 mr-2" />
            Moje žádosti ({myClaims.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          {/* Featured Rewards */}
          {rewards.filter(r => r.isFeatured).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Doporučené odměny
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {rewards.filter(r => r.isFeatured).map(reward => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    isEligible={isEligible(reward)}
                    canAfford={canAfford(reward)}
                    getCategoryIcon={getCategoryIcon}
                    onClaim={() => {
                      setSelectedReward(reward)
                      setClaimDialogOpen(true)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Rewards */}
          <h3 className="text-lg font-semibold mb-3">Všechny odměny</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.filter(r => !r.isFeatured).map(reward => (
              <RewardCard
                key={reward.id}
                reward={reward}
                isEligible={isEligible(reward)}
                canAfford={canAfford(reward)}
                getCategoryIcon={getCategoryIcon}
                onClaim={() => {
                  setSelectedReward(reward)
                  setClaimDialogOpen(true)
                }}
              />
            ))}
          </div>

          {rewards.length === 0 && (
            <Card className="p-8 text-center">
              <Gift className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Momentálně nejsou k dispozici žádné odměny</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-claims" className="space-y-4">
          {myClaims.length > 0 ? (
            myClaims.map(claim => (
              <Card key={claim.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{claim.reward.name}</CardTitle>
                      <CardDescription>{claim.reward.description}</CardDescription>
                    </div>
                    {getStatusBadge(claim.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    {claim.goldPaid > 0 && (
                      <span className="flex items-center gap-1">
                        💰 {claim.goldPaid} zlata
                      </span>
                    )}
                    {claim.gemsPaid > 0 && (
                      <span className="flex items-center gap-1">
                        💎 {claim.gemsPaid} diamantů
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(claim.createdAt).toLocaleDateString("cs-CZ")}
                    </span>
                  </div>
                  {claim.studentNote && (
                    <div className="bg-gray-50 p-2 rounded text-sm">
                      <p className="font-medium">Tvoje poznámka:</p>
                      <p className="text-gray-600">{claim.studentNote}</p>
                    </div>
                  )}
                  {claim.adminNote && (
                    <div className="bg-blue-50 p-2 rounded text-sm">
                      <p className="font-medium text-blue-700">Poznámka učitele:</p>
                      <p className="text-blue-600">{claim.adminNote}</p>
                    </div>
                  )}
                  {claim.rejectedReason && (
                    <div className="bg-red-50 p-2 rounded text-sm">
                      <p className="font-medium text-red-700">Důvod zamítnutí:</p>
                      <p className="text-red-600">{claim.rejectedReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <Award className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Zatím jsi nepožádal o žádnou odměnu</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Claim Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Žádat o odměnu</DialogTitle>
            <DialogDescription>
              Potvrdíš žádost o tuto odměnu? Měna bude odečtena ihned, ale odměnu obdržíš až po schválení učitelem.
            </DialogDescription>
          </DialogHeader>

          {selectedReward && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold">{selectedReward.name}</h4>
                <p className="text-sm text-gray-600">{selectedReward.description}</p>
                <div className="flex gap-3 mt-2">
                  {selectedReward.goldPrice > 0 && (
                    <span className="text-sm font-medium">💰 {selectedReward.goldPrice} zlata</span>
                  )}
                  {selectedReward.gemsPrice > 0 && (
                    <span className="text-sm font-medium">💎 {selectedReward.gemsPrice} diamantů</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="note">Poznámka pro učitele (volitelné)</Label>
                <Textarea
                  id="note"
                  placeholder="Např. 'Prosím o doručení v pátek odpoledne'"
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialogOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={handleClaimReward} disabled={claiming}>
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Žádám...
                </>
              ) : (
                "Potvrdit žádost"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Reward Card Component
function RewardCard({ reward, isEligible, canAfford, getCategoryIcon, onClaim }: any) {
  return (
    <Card className={`${reward.isFeatured ? "border-yellow-400 border-2 shadow-lg" : ""} ${!isEligible ? "opacity-60" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{getCategoryIcon(reward.category)}</span>
            <div>
              <CardTitle className="text-lg">{reward.name}</CardTitle>
              {reward.levelRequired > 0 && (
                <Badge variant="outline" className="text-xs">
                  Level {reward.levelRequired}+
                </Badge>
              )}
            </div>
          </div>
          {reward.isLimited && (
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
              <Clock className="w-3 h-3 mr-1" />
              Omezené
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">{reward.description}</p>

        <div className="flex gap-2 flex-wrap">
          {reward.goldPrice > 0 && (
            <Badge variant="secondary">💰 {reward.goldPrice} zlata</Badge>
          )}
          {reward.gemsPrice > 0 && (
            <Badge variant="secondary">💎 {reward.gemsPrice} diamantů</Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Zbývá: {reward.availableStock}/{reward.totalStock}
          </span>
          {reward.availableStock <= 5 && reward.availableStock > 0 && (
            <Badge variant="outline" className="bg-orange-50 text-orange-600">
              Málo skladem!
            </Badge>
          )}
        </div>

        <Button
          onClick={onClaim}
          disabled={!isEligible || reward.availableStock === 0}
          className="w-full"
          variant={isEligible ? "default" : "outline"}
        >
          {reward.availableStock === 0 ? (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Vyprodáno
            </>
          ) : !canAfford ? (
            "Nemáš dostatek měny"
          ) : !isEligible ? (
            "Nesplňuješ požadavky"
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Žádat o odměnu
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
