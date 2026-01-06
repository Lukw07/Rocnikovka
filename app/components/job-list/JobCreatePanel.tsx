"use client"

import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { useApiMutation, useApi } from "@/app/hooks/use-api"
import { Badge as BadgeModel } from "@/app/lib/generated"
import { toast } from "sonner"

interface SubjectItem {
  id: string
  name: string
  code?: string
}

interface BadgeItem extends BadgeModel {}

export default function JobCreatePanel({ onSuccess }: { onSuccess?: () => void }) {
  const { data: subjectsData, loading: subjectsLoading, error: subjectsError, execute: loadSubjects } = useApi<{ subjects: SubjectItem[] }>()
  const { data: badgesData, loading: badgesLoading, error: badgesError, execute: loadBadges } = useApi<{ badges: BadgeItem[] }>()

  useEffect(() => {
    const fetchSubjects = async () => {
      const res = await fetch('/api/subjects/mine')
      if (!res.ok) throw new Error('Nepodařilo se načíst předměty')
      const json = await res.json()
      return { subjects: json.data?.subjects || [] }
    }

    loadSubjects(fetchSubjects)
  }, [loadSubjects])

  useEffect(() => {
    const fetchBadges = async () => {
      const res = await fetch('/api/admin/badges')
      if (!res.ok) throw new Error('Nepodařilo se načíst badge')
      const json = await res.json()
      return { badges: json.badges || json.data?.badges || [] }
    }

    loadBadges(fetchBadges)
  }, [loadBadges])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [badgeId, setBadgeId] = useState<string | null>(null)
  const [xpReward, setXpReward] = useState<number>(10)
  const [moneyReward, setMoneyReward] = useState<number>(0)
  const [maxStudents, setMaxStudents] = useState<number | undefined>(1)
  const [formError, setFormError] = useState<string | null>(null)

  const { mutate: createJob, loading: creating } = useApiMutation(async (payload: any) => {
    const resp = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err.error?.message || 'Nepodařilo se vytvořit úkol')
    }
    const body = await resp.json()
    return body.data?.job
  }, {
    onSuccess: () => {
      if (onSuccess) onSuccess()
      // reset form
      setTitle('')
      setDescription('')
      setSubjectId(null)
      setXpReward(10)
      setMoneyReward(0)
      setMaxStudents(1)
      toast.success("Úkol vytvořen", {
        description: "Nový úkol byl úspěšně vytvořen."
      })
    },
    onError: (err) => {
      toast.error("Chyba", {
        description: err.message || "Nepodařilo se vytvořit úkol"
      })
    }
  })

  const validateAndSubmit = async () => {
    setFormError(null)
    // Basic client-side validation aligned with createJobSchema
    if (!title || title.trim().length < 1 || title.trim().length > 100) {
      setFormError('Název musí mít 1 až 100 znaků')
      return
    }
    if (!description || description.trim().length < 1 || description.trim().length > 1000) {
      setFormError('Popis musí mít 1 až 1000 znaků')
      return
    }
    if (!Number.isInteger(xpReward) || xpReward < 1 || xpReward > 10000) {
      setFormError('XP musí být celé číslo mezi 1 a 10000')
      return
    }
    if (!Number.isInteger(moneyReward) || moneyReward < 0 || moneyReward > 10000) {
      setFormError('Peněžitá odměna musí být celé číslo mezi 0 a 10000')
      return
    }
    if (maxStudents !== undefined && (!Number.isInteger(maxStudents) || maxStudents < 1 || maxStudents > 10)) {
      setFormError('Maximální počet studentů musí být celé číslo mezi 1 a 10')
      return
    }

    await createJob({
      title: title.trim(),
      description: description.trim(),
      ...(subjectId ? { subjectId } : {}),
      ...(badgeId ? { badgeId } : {}),
      xpReward,
      moneyReward,
      ...(maxStudents !== undefined && { maxStudents })
    })
  }

  const subjects = subjectsData?.subjects || []
  const badges = badgesData?.badges || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vytvořit nový úkol</CardTitle>
        <CardDescription>Vytvořte úkol, který mohou studenti vyplnit a získat odměnu.</CardDescription>
      </CardHeader>
      <CardContent>
        {subjectsLoading && <div className="text-sm text-muted-foreground">Načítám předměty…</div>}
        {subjectsError && <div className="text-destructive">Chyba při načítání předmětů</div>}

        <div className="grid grid-cols-1 gap-2">
          <div>
            <Label>Název</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Krátký název úkolu" />
          </div>

          <div>
            <Label>Popis</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailní popis úkolu" />
          </div>

          <div>
            <Label>Předmět (volitelné)</Label>
            <Select value={subjectId ?? ""} onValueChange={(v) => setSubjectId(v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Bez přiřazeného předmětu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Bez přiřazeného předmětu</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {subjectsLoading && <div className="text-xs text-muted-foreground mt-1">Načítám předměty…</div>}
            {subjectsError && <div className="text-xs text-destructive mt-1">Chyba při načítání předmětů</div>}
          </div>

          <div>
            <Label>Badge (volitelné, schvaluje administrátor)</Label>
            <Select value={badgeId ?? ""} onValueChange={(v) => setBadgeId(v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Bez badge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Bez badge</SelectItem>
                {badges.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {badgesLoading && <div className="text-xs text-muted-foreground mt-1">Načítám badge…</div>}
            {badgesError && <div className="text-xs text-destructive mt-1">Chyba při načítání badge</div>}
          </div>

          <div>
            <Label>XP odměna</Label>
            <Input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} />
          </div>

          <div>
            <Label>Peněžitá odměna</Label>
            <Input type="number" value={moneyReward} onChange={(e) => setMoneyReward(Number(e.target.value))} />
          </div>

          <div>
            <Label>Maximální počet studentů (volitelné)</Label>
            <Input type="number" value={maxStudents} onChange={(e) => setMaxStudents(e.target.value ? Number(e.target.value) : undefined)} />
          </div>

          {formError && <div className="text-destructive text-sm">{formError}</div>}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-end space-x-2">
        <Button variant="secondary" onClick={() => {
          // reset
          setTitle('')
          setDescription('')
          setSubjectId(null)
          setBadgeId(null)
          setXpReward(10)
          setMoneyReward(0)
          setMaxStudents(1)
          setFormError(null)
        }}>Zrušit</Button>
        <Button onClick={validateAndSubmit} disabled={creating}>{creating ? 'Vytvářím…' : 'Vytvořit úkol'}</Button>
      </CardFooter>
    </Card>
  )
}
