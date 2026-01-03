"use client"

import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Switch } from "@/app/components/ui/switch"
import { useApiMutation, useApi } from "@/app/hooks/use-api"
import { toast } from "sonner"
import { Badge } from "@/app/components/ui/badge"

interface SubjectItem {
  id: string
  name: string
  code?: string
}

interface Category {
  id: string
  name: string
  icon?: string
  color?: string
}

const TIER_OPTIONS = [
  { value: 'BASIC', label: 'Základní', color: '#9CA3AF', icon: '⭐' },
  { value: 'INTERMEDIATE', label: 'Středně pokročilý', color: '#3B82F6', icon: '⭐⭐' },
  { value: 'ADVANCED', label: 'Pokročilý', color: '#8B5CF6', icon: '⭐⭐⭐' },
  { value: 'EXPERT', label: 'Expertní', color: '#F59E0B', icon: '⭐⭐⭐⭐' },
  { value: 'LEGENDARY', label: 'Legendární', color: '#EF4444', icon: '⭐⭐⭐⭐⭐' }
]

export default function JobCreatePanel({ onSuccess }: { onSuccess?: () => void }) {
  const { data: subjectsData, loading: subjectsLoading, execute: loadSubjects } = useApi<{ subjects: SubjectItem[] }>()
  const { data: categoriesData, loading: categoriesLoading, execute: loadCategories } = useApi<{ categories: Category[] }>()

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
    const fetchCategories = async () => {
      const res = await fetch('/api/jobs/categories')
      if (!res.ok) throw new Error('Nepodařilo se načíst kategorie')
      const json = await res.json()
      return { categories: json.data?.categories || [] }
    }
    loadCategories(fetchCategories)
  }, [loadCategories])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [tier, setTier] = useState('BASIC')
  const [xpReward, setXpReward] = useState<number>(10)
  const [moneyReward, setMoneyReward] = useState<number>(0)
  const [skillpointsReward, setSkillpointsReward] = useState<number>(1)
  const [reputationReward, setReputationReward] = useState<number>(0)
  const [maxStudents, setMaxStudents] = useState<number>(1)
  const [isTeamJob, setIsTeamJob] = useState(false)
  const [requiredLevel, setRequiredLevel] = useState<number>(0)
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>()
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
      resetForm()
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

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setSubjectId(null)
    setCategoryId(null)
    setTier('BASIC')
    setXpReward(10)
    setMoneyReward(0)
    setSkillpointsReward(1)
    setReputationReward(0)
    setMaxStudents(1)
    setIsTeamJob(false)
    setRequiredLevel(0)
    setEstimatedHours(undefined)
    setFormError(null)
  }

  const validateAndSubmit = async () => {
    setFormError(null)
    
    if (!title || title.trim().length < 1 || title.trim().length > 100) {
      setFormError('Název musí mít 1 až 100 znaků')
      return
    }
    if (!description || description.trim().length < 1 || description.trim().length > 1000) {
      setFormError('Popis musí mít 1 až 1000 znaků')
      return
    }
    if (!subjectId) {
      setFormError('Vyberte předmět')
      return
    }
    if (!Number.isInteger(xpReward) || xpReward < 1 || xpReward > 10000) {
      setFormError('XP musí být mezi 1 a 10000')
      return
    }

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      subjectId,
      tier,
      xpReward,
      moneyReward,
      skillpointsReward,
      reputationReward,
      maxStudents,
      isTeamJob,
      requiredLevel
    }

    if (categoryId) payload.categoryId = categoryId
    if (estimatedHours) payload.estimatedHours = estimatedHours

    await createJob(payload)
  }

  const subjects = subjectsData?.subjects || []
  const categories = categoriesData?.categories || []
  const selectedTier = TIER_OPTIONS.find(t => t.value === tier) || TIER_OPTIONS[0]!

  if (!selectedTier) {
    return <div>Error: No tier options available</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vytvořit nový úkol (Job)</CardTitle>
        <CardDescription>Vytvořte úkol s kategoriemi, obtížností a odměnami pro studenty.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Základní informace */}
          <div className="md:col-span-2">
            <Label>Název úkolu</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Krátký a výstižný název" />
          </div>

          <div className="md:col-span-2">
            <Label>Popis úkolu</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Detailní popis toho, co studenti mají udělat" 
              rows={4}
            />
          </div>

          {/* Předmět a kategorie */}
          <div>
            <Label>Předmět</Label>
            <Select value={subjectId || undefined} onValueChange={(v) => setSubjectId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte předmět" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Kategorie (volitelné)</Label>
            <Select value={categoryId || undefined} onValueChange={(v) => setCategoryId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte kategorii" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon && <span className="mr-2">{c.icon}</span>}
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Obtížnost (Tier) */}
          <div className="md:col-span-2">
            <Label>Obtížnost (Tier)</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span style={{ color: t.color }}>{t.icon}</span> {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-1 text-sm text-muted-foreground">
              Vybraná obtížnost: <Badge style={{ backgroundColor: selectedTier.color }}>{selectedTier.icon} {selectedTier.label}</Badge>
            </div>
          </div>

          {/* Odměny */}
          <div>
            <Label>XP odměna</Label>
            <Input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} />
          </div>

          <div>
            <Label>Peníze</Label>
            <Input type="number" value={moneyReward} onChange={(e) => setMoneyReward(Number(e.target.value))} />
          </div>

          <div>
            <Label>Skillpoints</Label>
            <Input type="number" value={skillpointsReward} onChange={(e) => setSkillpointsReward(Number(e.target.value))} />
          </div>

          <div>
            <Label>Reputace</Label>
            <Input 
              type="number" 
              value={reputationReward} 
              onChange={(e) => setReputationReward(Number(e.target.value))} 
              placeholder="Může být záporná"
            />
          </div>

          {/* Týmové nastavení */}
          <div className="flex items-center space-x-2">
            <Switch checked={isTeamJob} onCheckedChange={setIsTeamJob} id="team-job" />
            <Label htmlFor="team-job">Týmový úkol</Label>
          </div>

          <div>
            <Label>Max. počet studentů</Label>
            <Input 
              type="number" 
              value={maxStudents} 
              onChange={(e) => setMaxStudents(Number(e.target.value))} 
              min={1}
              max={10}
            />
          </div>

          {/* Další parametry */}
          <div>
            <Label>Požadovaný level (min.)</Label>
            <Input type="number" value={requiredLevel} onChange={(e) => setRequiredLevel(Number(e.target.value))} min={0} />
          </div>

          <div>
            <Label>Odhadované hodiny (volitelné)</Label>
            <Input 
              type="number" 
              value={estimatedHours || ''} 
              onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : undefined)} 
              placeholder="Např. 2"
            />
          </div>

          {formError && (
            <div className="md:col-span-2 text-destructive text-sm p-3 bg-destructive/10 rounded">{formError}</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-end space-x-2">
        <Button variant="secondary" onClick={resetForm}>Zrušit</Button>
        <Button onClick={validateAndSubmit} disabled={creating}>
          {creating ? 'Vytvářím…' : 'Vytvořit úkol'}
        </Button>
      </CardFooter>
    </Card>
  )
}
