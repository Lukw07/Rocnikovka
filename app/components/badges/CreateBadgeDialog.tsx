"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { ItemRarity, ItemType } from "@/app/lib/generated"

interface CreateBadgeDialogProps {
  onSuccess?: () => void
}

export function CreateBadgeDialog({ onSuccess }: CreateBadgeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState(100)
  const [rarity, setRarity] = useState<ItemRarity>(ItemRarity.COMMON)
  const [imageUrl, setImageUrl] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price,
          rarity,
          type: ItemType.COLLECTIBLE, // Force type to COLLECTIBLE for badges
          imageUrl: imageUrl || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Nezdařilo se vytvořit odznak")
      }

      toast.success("Odznak byl úspěšně vytvořen")
      resetForm()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error("Chyba při vytváření odznaku", {
        description: error instanceof Error ? error.message : "Neznámá chyba",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setPrice(100)
    setRarity(ItemRarity.COMMON)
    setImageUrl("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Vytvořit odznak
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Vytvořit nový odznak</DialogTitle>
          <DialogDescription>
            Vytvořte nový sběratelský odznak, který si studenti mohou zakoupit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Název</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Např. Sběratel brouků" 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Popis</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Popis odznaku..." 
              required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Cena (mince)</Label>
              <Input 
                id="price" 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(Number(e.target.value))} 
                min={1} 
                max={10000} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rarity">Vzácnost</Label>
              <Select value={rarity} onValueChange={(value) => setRarity(value as ItemRarity)}>
                <SelectTrigger id="rarity">
                  <SelectValue placeholder="Vyberte vzácnost" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ItemRarity).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL Obrázku</Label>
            <Input 
              id="imageUrl" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
              placeholder="https://..." 
            />
            <p className="text-xs text-muted-foreground">
              Odkaz na obrázek odznaku.
            </p>
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Vytvářím..." : "Vytvořit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
