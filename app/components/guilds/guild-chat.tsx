"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Send } from "lucide-react"

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  member: {
    role: string
    user: {
      id: string
      name: string
      avatarUrl: string | null
    }
  }
}

interface GuildChatProps {
  guildId: string
  currentUserId: string
}

export function GuildChat({ guildId, currentUserId }: GuildChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [guildId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/chat?limit=50`)
      const data = await res.json()
      setMessages(data.messages?.reverse() || [])
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const res = await fetch(`/api/guilds/${guildId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage })
      })

      if (res.ok) {
        setNewMessage("")
        await fetchMessages()
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  if (loading) {
    return <div className="text-center py-8">Načítání chatu...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guildový chat</CardTitle>
        <CardDescription>
          Komunikujte se členy vaší guildy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Messages */}
          <div className="h-[400px] overflow-y-auto space-y-3 p-4 border rounded-lg bg-muted/20">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Zatím žádné zprávy. Buďte první!
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.member.user.id === currentUserId
                
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.member.user.avatarUrl || undefined} />
                      <AvatarFallback>
                        {msg.member.user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
                      <div className="text-xs text-muted-foreground mb-1">
                        <span className="font-medium">{msg.member.user.name}</span>
                        {" · "}
                        {new Date(msg.createdAt).toLocaleTimeString("cs-CZ", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                      <div
                        className={`inline-block px-3 py-2 rounded-lg ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Napište zprávu..."
              disabled={sending}
              maxLength={500}
            />
            <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
