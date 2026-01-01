"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"

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
import { Checkbox } from "@/app/components/ui/checkbox"
import { ItemRarity, ItemType } from "@/app/lib/generated"

interface CreateItemDialogProps {
  onSuccess?: () => void
}

export function CreateItemDialog({ onSuccess }: CreateItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState(100)
  const [imageUrl, setImageUrl] = useState("")
  const [rarity, setRarity] = useState<ItemRarity>(ItemRarity.COMMON)
  const [type, setType] = useState<ItemType>(ItemType.COSMETIC)
  const [isPurchasable, setIsPurchasable] = useState(true)

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
          price: Number(price),
          imageUrl,
          rarity,
          type,
          isPurchasable
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Nezdařilo se vytvořit předmět")
      }

      toast.success("Předmět byl úspěšně vytvořen")
      resetForm()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error("Chyba při vytváření předmětu", {
        description: error instanceof Error ? error.message : "Neznámá chyba",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      setImageUrl(data.url)
      toast.success("Obrázek nahrán")
    } catch (error) {
      toast.error("Chyba při nahrávání obrázku")
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setPrice(100)
    setImageUrl("")
    setRarity(ItemRarity.COMMON)
    setType(ItemType.COSMETIC)
    setIsPurchasable(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Vytvořit předmět
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Vytvořit nový předmět</DialogTitle>
          <DialogDescription>
            Vytvořte nový předmět do obchodu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Název</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Např. Zlatý meč" 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Popis</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Popis předmětu..." 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Cena</Label>
              <Input 
                id="price" 
                type="number"
                min="0"
                value={price} 
                onChange={(e) => setPrice(Number(e.target.value))} 
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Typ</Label>
              <Select value={type} onValueChange={(value) => setType(value as ItemType)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Vyberte typ" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ItemType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox 
                id="isPurchasable" 
                checked={isPurchasable} 
                onCheckedChange={(checked) => setIsPurchasable(checked as boolean)} 
              />
              <Label htmlFor="isPurchasable">Lze zakoupit</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">Obrázek</Label>
            <div className="flex gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="cursor-pointer"
              />
            </div>
            {isUploading && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Nahrávám...</p>}
            {imageUrl && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Náhled:</p>
                <img src={imageUrl} alt="Preview" className="h-16 w-16 object-contain rounded-md border" />
              </div>
            )}
            <Input 
              id="imageUrl" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
              placeholder="https://..." 
              className="hidden"
            />
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
