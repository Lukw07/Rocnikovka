"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Gift, CheckCircle, XCircle, Package, AlertCircle, Plus, Edit, Clock } from "lucide-react"
import { toast } from "sonner"

interface RealLifeReward {
  id: string
  name: string
  description: string
  category: string
  goldPrice: number
  gemsPrice: number
  levelRequired: number
  availableStock: number
  totalStock: number
  isActive: boolean
  isFeatured: boolean
}

interface RewardClaim {
  id: string
  userId: string
  status: string
  goldPaid: number
  gemsPaid: number
  studentNote?: string
  adminNote?: string
  rejectedReason?: string
  createdAt: string
  reward: RealLifeReward
}

export function TeacherRewardsManagement() {
  const [rewards, setRewards] = useState<RealLifeReward[]>([])
  const [pendingClaims, setPendingClaims] = useState<RewardClaim[]>([])
  const [allClaims, setAllClaims] = useState<RewardClaim[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [claimActionDialog, setClaimActionDialog] = useState<{
    open: boolean
    claim: RewardClaim | null
    action: "approve" | "reject" | "complete" | null
  }>({ open: false, claim: null, action: null })

  const [adminNote, setAdminNote] = useState("")
  const [rejectedReason, setRejectedReason] = useState("")
  const [processing, setProcessing] = useState(false)

  // New reward form
  const [newReward, setNewReward] = useState({
    name: "",
    description: "",
    category: "FOOD",
    goldPrice: 0,
    gemsPrice: 0,
    levelRequired: 0,
    totalStock: 1,
    isFeatured: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([
      loadRewards(),
      loadPendingClaims(),
      loadAllClaims()
    ])
    setLoading(false)
  }

  const loadRewards = async () => {
    try {
      const response = await fetch("/api/real-rewards")
      const data = await response.json()
      if (data.success) {
        setRewards(data.data.rewards)
      }
    } catch (error) {
      console.error("Failed to load rewards:", error)
    }
  }

  const loadPendingClaims = async () => {
    try {
      const response = await fetch("/api/real-rewards/claims?status=PENDING")
      const data = await response.json()
      if (data.success) {
        setPendingClaims(data.data.claims)
      }
    } catch (error) {
      console.error("Failed to load pending claims:", error)
    }
  }

  const loadAllClaims = async () => {
    try {
      const response = await fetch("/api/real-rewards/claims")
      const data = await response.json()
      if (data.success) {
        setAllClaims(data.data.claims)
      }
    } catch (error) {
      console.error("Failed to load claims:", error)
    }
  }

  const handleCreateReward = async () => {
    if (!newReward.name || !newReward.description) {
      toast.error("Vyplňte název a popis")
      return
    }

    setProcessing(true)
    try {
      const response = await fetch("/api/real-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReward)
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Odměna vytvořena!")
        setCreateDialogOpen(false)
        setNewReward({
          name: "",
          description: "",
          category: "FOOD",
          goldPrice: 0,
          gemsPrice: 0,
          levelRequired: 0,
          totalStock: 1,
          isFeatured: false
        })
        loadRewards()
      } else {
        toast.error(data.error || "Chyba při vytváření odměny")
      }
    } catch (error) {
      console.error("Failed to create reward:", error)
      toast.error("Chyba při vytváření odměny")
    } finally {
      setProcessing(false)
    }
  }

  const handleApproveClaim = async () => {
    if (!claimActionDialog.claim) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/real-rewards/claims/${claimActionDialog.claim.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Žádost schválena!")
        setClaimActionDialog({ open: false, claim: null, action: null })
        setAdminNote("")
        loadData()
      } else {
        toast.error(data.error || "Chyba při schvalování")
      }
    } catch (error) {
      console.error("Failed to approve claim:", error)
      toast.error("Chyba při schvalování")
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectClaim = async () => {
    if (!claimActionDialog.claim || !rejectedReason) {
      toast.error("Vyplňte důvod zamítnutí")
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/real-rewards/claims/${claimActionDialog.claim.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectedReason })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Žádost zamítnuta a peníze vráceny")
        setClaimActionDialog({ open: false, claim: null, action: null })
        setRejectedReason("")
        loadData()
      } else {
        toast.error(data.error || "Chyba při zamítání")
      }
    } catch (error) {
      console.error("Failed to reject claim:", error)
      toast.error("Chyba při zamítání")
    } finally {
      setProcessing(false)
    }
  }

  const handleCompleteClaim = async () => {
    if (!claimActionDialog.claim) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/real-rewards/claims/${claimActionDialog.claim.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Odměna označena jako předaná!")
        setClaimActionDialog({ open: false, claim: null, action: null })
        loadData()
      } else {
        toast.error(data.error || "Chyba při dokončování")
      }
    } catch (error) {
      console.error("Failed to complete claim:", error)
      toast.error("Chyba při dokončování")
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Čeká na schválení</Badge>
      case "APPROVED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Schváleno</Badge>
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Předáno</Badge>
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-700">Zamítnuto</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-linear-to-r from-purple-500 to-indigo-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Gift className="w-8 h-8" />
            Správa reálných odměn
          </CardTitle>
          <CardDescription className="text-white/90">
            Vytvářej odměny a spravuj žádosti studentů
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 rounded-lg p-4">
              <Package className="w-8 h-8 mb-2" />
              <p className="text-2xl font-bold">{rewards.length}</p>
              <p className="text-sm opacity-90">Aktivních odměn</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-2xl font-bold">{pendingClaims.length}</p>
              <p className="text-sm opacity-90">Čekajících žádostí</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <CheckCircle className="w-8 h-8 mb-2" />
              <p className="text-2xl font-bold">{allClaims.filter(c => c.status === "COMPLETED").length}</p>
              <p className="text-sm opacity-90">Předaných odměn</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            <Clock className="w-4 h-4 mr-2" />
            Čekající ({pendingClaims.length})
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Package className="w-4 h-4 mr-2" />
            Odměny ({rewards.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Historie ({allClaims.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Claims */}
        <TabsContent value="pending" className="space-y-4">
          {pendingClaims.length > 0 ? (
            pendingClaims.map(claim => (
              <Card key={claim.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{claim.reward.name}</CardTitle>
                      <CardDescription>
                        Student ID: {claim.userId.substring(0, 8)}...
                      </CardDescription>
                    </div>
                    {getStatusBadge(claim.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    {claim.goldPaid > 0 && (
                      <Badge variant="secondary">💰 {claim.goldPaid} zlata</Badge>
                    )}
                    {claim.gemsPaid > 0 && (
                      <Badge variant="secondary">💎 {claim.gemsPaid} diamantů</Badge>
                    )}
                  </div>
                  {claim.studentNote && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm font-medium">Poznámka studenta:</p>
                      <p className="text-sm text-gray-600">{claim.studentNote}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => setClaimActionDialog({ open: true, claim, action: "approve" })}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Schválit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setClaimActionDialog({ open: true, claim, action: "reject" })}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Zamítnout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Žádné čekající žádosti</p>
            </Card>
          )}
        </TabsContent>

        {/* Rewards Management */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Vytvořit odměnu
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map(reward => (
              <Card key={reward.id} className={!reward.isActive ? "opacity-60" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg">{reward.name}</CardTitle>
                  <CardDescription>{reward.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    {reward.goldPrice > 0 && (
                      <Badge variant="secondary">💰 {reward.goldPrice}</Badge>
                    )}
                    {reward.gemsPrice > 0 && (
                      <Badge variant="secondary">💎 {reward.gemsPrice}</Badge>
                    )}
                    {reward.levelRequired > 0 && (
                      <Badge variant="outline">Lvl {reward.levelRequired}+</Badge>
                    )}
                    {reward.isFeatured && (
                      <Badge variant="outline" className="bg-yellow-50">⭐ Featured</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Sklad: {reward.availableStock}/{reward.totalStock}
                  </div>
                  <div className="text-xs text-gray-500">
                    {reward.category}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-4">
          {allClaims.map(claim => (
            <Card key={claim.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{claim.reward.name}</CardTitle>
                    <CardDescription>
                      {new Date(claim.createdAt).toLocaleDateString("cs-CZ")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    {getStatusBadge(claim.status)}
                    {claim.status === "APPROVED" && (
                      <Button
                        size="sm"
                        onClick={() => setClaimActionDialog({ open: true, claim, action: "complete" })}
                      >
                        Předat
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Create Reward Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vytvořit novou odměnu</DialogTitle>
            <DialogDescription>
              Vytvoř reálnou odměnu, kterou mohou studenti získat za herní měnu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Název odměny *</Label>
              <Input
                id="name"
                value={newReward.name}
                onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                placeholder="Např. Lístek do kina"
              />
            </div>

            <div>
              <Label htmlFor="description">Popis *</Label>
              <Textarea
                id="description"
                value={newReward.description}
                onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                placeholder="Podrobný popis odměny"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Kategorie</Label>
                <Select value={newReward.category} onValueChange={(value) => setNewReward({ ...newReward, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FOOD">🍕 Jídlo a pití</SelectItem>
                    <SelectItem value="ENTERTAINMENT">🎬 Zábava</SelectItem>
                    <SelectItem value="SCHOOL_PERKS">🎓 Školní výhody</SelectItem>
                    <SelectItem value="MERCHANDISE">👕 Merchandise</SelectItem>
                    <SelectItem value="GIFT_CARD">🎁 Dárkové poukazy</SelectItem>
                    <SelectItem value="EVENT_TICKET">🎟️ Vstupenky</SelectItem>
                    <SelectItem value="OTHER">⭐ Ostatní</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="totalStock">Počet kusů</Label>
                <Input
                  id="totalStock"
                  type="number"
                  min="1"
                  value={newReward.totalStock}
                  onChange={(e) => setNewReward({ ...newReward, totalStock: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="goldPrice">Cena (zlato)</Label>
                <Input
                  id="goldPrice"
                  type="number"
                  min="0"
                  value={newReward.goldPrice}
                  onChange={(e) => setNewReward({ ...newReward, goldPrice: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="gemsPrice">Cena (diamanty)</Label>
                <Input
                  id="gemsPrice"
                  type="number"
                  min="0"
                  value={newReward.gemsPrice}
                  onChange={(e) => setNewReward({ ...newReward, gemsPrice: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="levelRequired">Min. level</Label>
                <Input
                  id="levelRequired"
                  type="number"
                  min="0"
                  value={newReward.levelRequired}
                  onChange={(e) => setNewReward({ ...newReward, levelRequired: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={newReward.isFeatured}
                onChange={(e) => setNewReward({ ...newReward, isFeatured: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isFeatured" className="cursor-pointer">
                ⭐ Doporučená odměna (zobrazí se na vrcholu)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={handleCreateReward} disabled={processing}>
              {processing ? "Vytvářím..." : "Vytvořit odměnu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claim Action Dialog */}
      <Dialog open={claimActionDialog.open} onOpenChange={(open) => !open && setClaimActionDialog({ open: false, claim: null, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {claimActionDialog.action === "approve" && "Schválit žádost"}
              {claimActionDialog.action === "reject" && "Zamítnout žádost"}
              {claimActionDialog.action === "complete" && "Předat odměnu"}
            </DialogTitle>
          </DialogHeader>

          {claimActionDialog.claim && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">{claimActionDialog.claim.reward.name}</p>
                <p className="text-sm text-gray-600">
                  Student: {claimActionDialog.claim.userId.substring(0, 12)}...
                </p>
              </div>

              {claimActionDialog.action === "approve" && (
                <div>
                  <Label htmlFor="adminNote">Poznámka pro studenta (volitelné)</Label>
                  <Textarea
                    id="adminNote"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Např. 'Vyzvednout můžeš zítra v kanceláři'"
                    rows={3}
                  />
                </div>
              )}

              {claimActionDialog.action === "reject" && (
                <div>
                  <Label htmlFor="rejectedReason">Důvod zamítnutí *</Label>
                  <Textarea
                    id="rejectedReason"
                    value={rejectedReason}
                    onChange={(e) => setRejectedReason(e.target.value)}
                    placeholder="Vysvětli, proč byla žádost zamítnuta"
                    rows={3}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Měna bude studentovi automaticky vrácena
                  </p>
                </div>
              )}

              {claimActionDialog.action === "complete" && (
                <p className="text-sm text-gray-600">
                  Potvrdíš, že jsi předal odměnu studentovi?
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimActionDialog({ open: false, claim: null, action: null })}>
              Zrušit
            </Button>
            <Button
              onClick={() => {
                if (claimActionDialog.action === "approve") handleApproveClaim()
                else if (claimActionDialog.action === "reject") handleRejectClaim()
                else if (claimActionDialog.action === "complete") handleCompleteClaim()
              }}
              disabled={processing}
              variant={claimActionDialog.action === "reject" ? "destructive" : "default"}
            >
              {processing ? "Zpracovávám..." : "Potvrdit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
