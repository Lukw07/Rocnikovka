"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Badge } from "@/app/components/ui/badge"
import { Progress } from "@/app/components/ui/progress"

interface MathProblem {
  question: string
  answer: number
}

interface MathMiniGameProps {
  questId: string
  problemCount?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  onComplete: (score: number) => void
}

export function MathMiniGame({ 
  questId, 
  problemCount = 10, 
  difficulty = 'medium',
  onComplete 
}: MathMiniGameProps) {
  const [problems, setProblems] = useState<MathProblem[]>([])
  const [currentProblem, setCurrentProblem] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Generate math problems
    const generated: MathProblem[] = []
    for (let i = 0; i < problemCount; i++) {
      generated.push(generateProblem(difficulty))
    }
    setProblems(generated)
  }, [problemCount, difficulty])

  useEffect(() => {
    // Timer
    if (isComplete || problems.length === 0) return
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentProblem, isComplete, problems])

  const generateProblem = (diff: string): MathProblem => {
    let a, b, operation
    
    switch (diff) {
      case 'easy':
        a = Math.floor(Math.random() * 10) + 1
        b = Math.floor(Math.random() * 10) + 1
        operation = Math.random() > 0.5 ? '+' : '-'
        break
      case 'medium':
        a = Math.floor(Math.random() * 50) + 1
        b = Math.floor(Math.random() * 20) + 1
        operation = ['+', '-', '*'][Math.floor(Math.random() * 3)]
        break
      case 'hard':
        a = Math.floor(Math.random() * 100) + 10
        b = Math.floor(Math.random() * 50) + 1
        operation = ['+', '-', '*', '/'][Math.floor(Math.random() * 4)]
        if (operation === '/') {
          // Ensure divisible
          a = a - (a % b)
        }
        break
      default:
        a = 1
        b = 1
        operation = '+'
    }

    let answer
    let question
    
    switch (operation) {
      case '+':
        answer = a + b
        question = `${a} + ${b}`
        break
      case '-':
        answer = a - b
        question = `${a} - ${b}`
        break
      case '*':
        answer = a * b
        question = `${a} × ${b}`
        break
      case '/':
        answer = a / b
        question = `${a} ÷ ${b}`
        break
      default:
        answer = 0
        question = "0"
    }

    return { question, answer }
  }

  const handleSubmit = () => {
    if (!userAnswer) return

    const current = problems[currentProblem]
    if (!current) return

    const isCorrect = parseFloat(userAnswer) === current.answer
    if (isCorrect) {
      setScore(score + 1)
    }

    if (currentProblem < problems.length - 1) {
      setCurrentProblem(currentProblem + 1)
      setUserAnswer("")
      setTimeLeft(30)
    } else {
      finishGame(isCorrect ? score + 1 : score)
    }
  }

  const handleTimeout = () => {
    if (currentProblem < problems.length - 1) {
      setCurrentProblem(currentProblem + 1)
      setUserAnswer("")
      setTimeLeft(30)
    } else {
      finishGame(score)
    }
  }

  const finishGame = (finalScore: number) => {
    setIsComplete(true)
    const percentScore = (finalScore / problems.length) * 100
    onComplete(percentScore)
  }

  if (problems.length === 0) {
    return <div>Načítání...</div>
  }

  if (isComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matematická hra dokončena! 🎉</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-lg">
            Skóre: {score} / {problems.length} ({Math.round((score / problems.length) * 100)}%)
          </p>
        </CardContent>
      </Card>
    )
  }

  const progress = ((currentProblem + 1) / problems.length) * 100
  const problem = problems[currentProblem]

  if (!problem) {
    return <div>Načítání...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <Badge>Příklad {currentProblem + 1} / {problems.length}</Badge>
          <Badge variant={timeLeft < 10 ? "destructive" : "secondary"}>
            ⏱️ {timeLeft}s
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mb-4" />
        <CardTitle className="text-4xl text-center">{problem.question} = ?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Zadejte odpověď"
            className="text-2xl text-center"
            autoFocus
          />
          <Button onClick={handleSubmit} className="w-full" size="lg">
            Potvrdit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
