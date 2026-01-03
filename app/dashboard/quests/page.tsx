import React from "react"
import { Metadata } from "next"
import { QuestsList } from "@/app/components/quests/quests-list"
import { QuestTracker } from "@/app/components/quests/quest-tracker"

export const metadata: Metadata = {
  title: "Questy",
  description: "Přijímejte a plňte questy, aby jste získali XP a odměny"
}

export default function QuestsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">🎯 Questy</h1>
        <p className="text-muted-foreground">
          Vyberte si questy a plňte je, aby jste získali XP, peníze a skillpointy
        </p>
      </div>

      {/* Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Vaše Statistiky</h2>
        <QuestTracker />
      </div>

      {/* Quests */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Dostupné Questy</h2>
        <QuestsList />
      </div>
    </div>
  )
}
