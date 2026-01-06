'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Progress } from '@/app/components/ui/progress'
import { toast } from 'sonner'
import { Lightbulb, Gift } from 'lucide-react'

interface DailyQuestion {
  id: string
  question: string
  options: string[]
  difficulty: string
  xpReward: number
  moneyReward: number
  skillpointReward: number
}

interface DailyQuestionAnswer {
  selectedAnswer: number
  isCorrect: boolean
}

interface Props {
  eventId: string
}

export function DailyQuestionPanel({ eventId }: Props) {
  const [question, setQuestion] = useState<DailyQuestion | null>(null)
  const [userAnswer, setUserAnswer] = useState<DailyQuestionAnswer | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQuestion()
  }, [eventId])

  const fetchQuestion = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/daily-questions?eventId=${eventId}`)
      if (res.ok) {
        const data = await res.json()
        setQuestion(data.data?.question)
        setUserAnswer(data.data?.userAnswer)
      }
    } catch (error) {
      toast.error('Chyba při načítání otázky')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async () => {
    if (!question || selectedAnswer === null) return

    try {
      setSubmitting(true)
      const res = await fetch('/api/events/daily-questions/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          selectedAnswer
        })
      })

      if (res.ok) {
        const data = await res.json()
        setUserAnswer(data.data?.answer)
        
        if (data.data?.isCorrect) {
          toast.success('Správně! 🎉', {
            description: `+${question.xpReward} XP, +${question.moneyReward} Kč, +${question.skillpointReward} skillpoint`
          })
        } else {
          toast.error('Špatně ❌', {
            description: 'Zkus to zítra znovu!'
          })
        }
      } else {
        toast.error('Chyba při odpovědi')
      }
    } catch (error) {
      toast.error('Chyba při odeslání odpovědi')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Card><CardContent className="pt-6">Načítání otázky...</CardContent></Card>
  }

  if (!question) {
    return <Card><CardContent className="pt-6">Dnes není žádná otázka. Zkuste později!</CardContent></Card>
  }

  if (userAnswer) {
    return (
      <Card className={userAnswer.isCorrect ? 'border-green-500' : 'border-red-500'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Denní otázka
          </CardTitle>
          <CardDescription>
            Již jsi odpověděl/a
            {userAnswer.isCorrect && ' správně! ✅'}
            {!userAnswer.isCorrect && ' špatně ❌'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-medium">{question.question}</p>
          <p className="text-sm text-muted-foreground">
            Tvá odpověď: <span className="font-semibold">{question.options[userAnswer.selectedAnswer]}</span>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Denní otázka
        </CardTitle>
        <CardDescription>
          <Badge variant="outline">{question.difficulty}</Badge>
          <span className="ml-2">
            <Gift className="w-3 h-3 inline mr-1" />
            {question.xpReward} XP • {question.moneyReward} Kč • {question.skillpointReward} SP
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-semibold">{question.question}</p>
        
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedAnswer(index)}
              disabled={submitting}
              className={`w-full p-3 text-left rounded-lg border-2 transition ${
                selectedAnswer === index
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <Button
          onClick={handleAnswer}
          disabled={selectedAnswer === null || submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? 'Odesílám...' : 'Odeslat odpověď'}
        </Button>
      </CardContent>
    </Card>
  )
}
