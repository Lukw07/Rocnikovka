"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Users } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { Label } from "@/app/components/ui/label"
import { Badge as BadgeModel } from "@/app/lib/generated"

interface AssignBadgeToClassDialogProps {
  badge: BadgeModel
}

interface ClassModel {
  id: string
  name: string
}

export function AssignBadgeToClassDialog({ badge }: AssignBadgeToClassDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<ClassModel[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && classes.length === 0) {
      setLoading(true)
      fetch("/api/admin/classes")
        .then(res => res.json())
        .then(data => {
          if (data.classes) {
            setClasses(data.classes)
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [open, classes.length])

  const handleAssign = async () => {
    if (!selectedClass) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/badges/assign-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeId: badge.id,
          classId: selectedClass
        })
      })

      if (!res.ok) throw new Error("Failed to assign badge")

      toast.success(`Odznak ${badge.name} byl přiřazen třídě`)
      setOpen(false)
    } catch (error) {
      toast.error("Chyba při přiřazování odznaku")
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2">
          <Users className="mr-2 h-4 w-4" />
          Přiřadit třídě
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Přiřadit odznak třídě</DialogTitle>
          <DialogDescription>
            Vyberte třídu, které chcete hromadně přidělit odznak <strong>{badge.name}</strong>.
            Studenti, kteří již odznak mají, jej nedostanou znovu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Třída</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte třídu" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Zrušit</Button>
          <Button onClick={handleAssign} disabled={submitting || !selectedClass}>
            {submitting ? "Přiřazuji..." : "Přiřadit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
