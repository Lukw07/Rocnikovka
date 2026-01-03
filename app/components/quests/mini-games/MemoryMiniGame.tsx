"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"

interface MemoryCard {
  id: number
  value: string
  isFlipped: boolean
  isMatched: boolean
}

interface MemoryMiniGameProps {
  questId: string
  pairs: string[] // Array of values to match (will be duplicated)
  onComplete: (score: number) => void
}

export function MemoryMiniGame({ questId, pairs, onComplete }: MemoryMiniGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Initialize cards
    const duplicatedPairs = [...pairs, ...pairs]
    const shuffled = duplicatedPairs
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5)

    setCards(shuffled)
  }, [pairs])

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2) return
    const selectedCard = cards[id]
    if (!selectedCard) return
    if (selectedCard.isFlipped || selectedCard.isMatched) return

    const newCards = [...cards]
    newCards[id] = { ...selectedCard, isFlipped: true }
    setCards(newCards)

    const newFlipped = [...flippedCards, id]
    setFlippedCards(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(moves + 1)
      const [first, second] = newFlipped
      if (first === undefined || second === undefined) return
      const firstCard = newCards[first]
      const secondCard = newCards[second]
      if (!firstCard || !secondCard) return
      
      if (firstCard.value === secondCard.value) {
        // Match!
        setTimeout(() => {
          const matchedCards = [...newCards]
          if (matchedCards[first]) matchedCards[first] = { ...matchedCards[first], isMatched: true }
          if (matchedCards[second]) matchedCards[second] = { ...matchedCards[second], isMatched: true }
          setCards(matchedCards)
          setFlippedCards([])
          
          const newMatches = matches + 1
          setMatches(newMatches)
          
          // Check if game is complete
          if (newMatches === pairs.length) {
            setIsComplete(true)
            // Calculate score based on moves (fewer moves = higher score)
            const perfectMoves = pairs.length
            const score = Math.max(0, 100 - (moves - perfectMoves) * 5)
            onComplete(score)
          }
        }, 600)
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...newCards]
          if (resetCards[first]) resetCards[first] = { ...resetCards[first], isFlipped: false }
          if (resetCards[second]) resetCards[second] = { ...resetCards[second], isFlipped: false }
          setCards(resetCards)
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  if (isComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memory hra dokončena! 🎉</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center">
            Dokončeno v {moves} tazích!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Memory Hra</CardTitle>
          <div className="flex gap-4">
            <Badge>Tahy: {moves}</Badge>
            <Badge variant="secondary">Páry: {matches} / {pairs.length}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square p-4 rounded-lg border-2 transition-all ${
                card.isFlipped || card.isMatched
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              disabled={card.isMatched}
            >
              {(card.isFlipped || card.isMatched) ? (
                <span className="text-2xl">{card.value}</span>
              ) : (
                <span className="text-3xl">❓</span>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
