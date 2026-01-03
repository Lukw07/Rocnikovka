"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { toast } from "sonner"

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
}

interface QuizMiniGameProps {
  questId: string
  questions: QuizQuestion[]
  onComplete: (score: number) => void
}

export function QuizMiniGame({ questId, questions, onComplete }: QuizMiniGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const handleAnswer = () => {
    if (selectedAnswer === null) return

    const current = questions[currentQuestion]
    if (!current) return

    const isCorrect = selectedAnswer === current.correctAnswer
    if (isCorrect) {
      setScore(score + 1)
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
    } else {
      // Quiz complete
      const finalScore = isCorrect ? score + 1 : score
      const percentScore = (finalScore / questions.length) * 100
      setIsComplete(true)
      onComplete(percentScore)
    }
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  if (isComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz dokončen! 🎉</CardTitle>
          <CardDescription>
            Vaše skóre: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Quest byl automaticky aktualizován.</p>
        </CardContent>
      </Card>
    )
  }

  const question = questions[currentQuestion]

  if (!question) {
    return <div>Načítání...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <Badge>Otázka {currentQuestion + 1} / {questions.length}</Badge>
          <span className="text-sm text-muted-foreground">Skóre: {score}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="mt-4">{question.question}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedAnswer(index)}
              className={`w-full p-4 text-left rounded-lg border-2 transition ${
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
          disabled={selectedAnswer === null}
          className="w-full mt-4"
        >
          {currentQuestion < questions.length - 1 ? 'Další otázka' : 'Dokončit quiz'}
        </Button>
      </CardContent>
    </Card>
  )
}
