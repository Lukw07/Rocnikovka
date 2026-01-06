"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Textarea } from "@/app/components/ui/textarea"
import { UserPlus, Check, X, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog"
import Image from "next/image"

interface JoinRequest {
  id: string
  userId: string
  guildId: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  message: string | null
  createdAt: string
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

interface GuildJoinRequestsProps {
  guildId: string
  isLeader: boolean
  isOfficer: boolean
}

export function GuildJoinRequests({
  guildId,
  isLeader,
  isOfficer
}: GuildJoinRequestsProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const canManageRequests = isLeader || isOfficer

  useEffect(() => {
    fetchRequests()
  }, [guildId])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/guilds/${guildId}/requests`)
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (err: any) {
      setError("Nepodařilo se načíst požadavky na vstup")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      setProcessing(requestId)
      const res = await fetch(`/api/guilds/${guildId}/requests/${requestId}/approve`, {
        method: "POST"
      })

      if (!res.ok) {
        throw new Error("Nepodařilo se schválit požadavek")
      }

      setRequests(requests.map(r =>
        r.id === requestId ? { ...r, status: "APPROVED" as const } : r
      ))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectClick = (requestId: string) => {
    setSelectedRequestId(requestId)
    setRejectReason("")
    setShowRejectDialog(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedRequestId) return

    try {
      setProcessing(selectedRequestId)
      const res = await fetch(`/api/guilds/${guildId}/requests/${selectedRequestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason || null })
      })

      if (!res.ok) {
        throw new Error("Nepodařilo se odmítnout požadavek")
      }

      setRequests(requests.map(r =>
        r.id === selectedRequestId ? { ...r, status: "REJECTED" as const } : r
      ))
      setShowRejectDialog(false)
      setSelectedRequestId(null)
      setRejectReason("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(null)
    }
  }

  const pendingRequests = requests.filter(r => r.status === "PENDING")
  const approvedRequests = requests.filter(r => r.status === "APPROVED")
  const rejectedRequests = requests.filter(r => r.status === "REJECTED")

  if (!canManageRequests) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">Nemáte oprávnění</p>
              <p className="text-xs text-amber-700">Pouze vedoucí a důstojníci guildů mohou spravovat žádosti o vstup</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Nevyřízené žádosti
              </CardTitle>
              <CardDescription>
                {pendingRequests.length} {pendingRequests.length === 1 ? "žádost" : "žádostí"} čeká na schválení
              </CardDescription>
            </div>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="text-base px-3 py-1">
                {pendingRequests.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Načítání...</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Žádné nevyřízené žádosti</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {request.user.avatarUrl && (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={request.user.avatarUrl}
                          alt={request.user.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{request.user.name}</p>
                      {request.message && (
                        <p className="text-xs text-muted-foreground truncate">
                          &quot;{request.message}&quot;
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleString("cs-CZ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(request.id)}
                      disabled={processing === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Dialog open={showRejectDialog && selectedRequestId === request.id} onOpenChange={setShowRejectDialog}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectClick(request.id)}
                          disabled={processing === request.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Odmítnutí žádosti</DialogTitle>
                          <DialogDescription>
                            Odmítáte vstup uživatele {request.user.name} do gildé
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Důvod (nepovinné)</label>
                            <Textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Napište důvod odmítnutí..."
                              rows={3}
                              maxLength={200}
                              className="mt-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {rejectReason.length}/200
                            </p>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowRejectDialog(false)
                                setSelectedRequestId(null)
                              }}
                            >
                              Zrušit
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleRejectConfirm}
                              disabled={processing === request.id}
                            >
                              Odmítnout
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Requests */}
      {approvedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Check className="h-5 w-5" />
              Schválené žádosti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {approvedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  {request.user.avatarUrl && (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src={request.user.avatarUrl}
                        alt={request.user.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="text-sm font-medium text-green-900 flex-1">{request.user.name}</span>
                  <Badge variant="secondary" className="bg-green-200 text-green-800">
                    Přijato
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <X className="h-5 w-5" />
              Odmítnuté žádosti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rejectedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  {request.user.avatarUrl && (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src={request.user.avatarUrl}
                        alt={request.user.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="text-sm font-medium text-red-900 flex-1">{request.user.name}</span>
                  <Badge variant="destructive" className="bg-red-200 text-red-800">
                    Odmítnuto
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
