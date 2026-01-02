"use client"

import * as React from "react"
import { useState } from "react"
import { 
  RpgButton 
} from "@/app/components/ui/rpg-button"
import { 
  RpgCard, 
  RpgCardHeader, 
  RpgCardTitle, 
  RpgCardDescription, 
  RpgCardContent,
  RpgCardFooter,
  QuestCard,
  AchievementCard,
  InventorySlot
} from "@/app/components/ui/rpg-card"
import { 
  RpgBadge, 
  LevelBadge, 
  XpBadge, 
  RarityBadge, 
  StatusBadge 
} from "@/app/components/ui/rpg-badge"
import { 
  RpgIcon,
  ShieldIcon,
  SwordIcon,
  ScrollIcon,
  CrystalIcon,
  StarIcon,
  CrownIcon,
  CoinIcon,
  GemIcon,
  PotionIcon,
  ChestIcon,
  QuestIcon,
  BookIcon
} from "@/app/components/ui/rpg-icons"
import { Sparkles, Zap, Trophy } from "lucide-react"

export default function RpgShowcasePage() {
  const [selectedTab, setSelectedTab] = useState<"buttons" | "cards" | "badges" | "icons">("buttons")

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-cinzel font-bold text-foreground">
            RPG Komponenty
          </h1>
          <p className="text-lg text-muted-foreground font-inter">
            Moderní herní rozhraní pro EduRPG aplikaci
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-2">
          <RpgButton 
            variant={selectedTab === "buttons" ? "default" : "outline"}
            onClick={() => setSelectedTab("buttons")}
          >
            Tlačítka
          </RpgButton>
          <RpgButton 
            variant={selectedTab === "cards" ? "default" : "outline"}
            onClick={() => setSelectedTab("cards")}
          >
            Karty
          </RpgButton>
          <RpgButton 
            variant={selectedTab === "badges" ? "default" : "outline"}
            onClick={() => setSelectedTab("badges")}
          >
            Odznaky
          </RpgButton>
          <RpgButton 
            variant={selectedTab === "icons" ? "default" : "outline"}
            onClick={() => setSelectedTab("icons")}
          >
            Ikony
          </RpgButton>
        </div>

        {/* Buttons Section */}
        {selectedTab === "buttons" && (
          <div className="space-y-8">
            <RpgCard variant="elevated">
              <RpgCardHeader>
                <RpgCardTitle>Základní tlačítka</RpgCardTitle>
                <RpgCardDescription>
                  Tlačítka s různými variantami a velikostmi
                </RpgCardDescription>
              </RpgCardHeader>
              <RpgCardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <RpgButton variant="default">Default</RpgButton>
                  <RpgButton variant="secondary">Secondary</RpgButton>
                  <RpgButton variant="accent">Accent</RpgButton>
                  <RpgButton variant="destructive">Destructive</RpgButton>
                  <RpgButton variant="outline">Outline</RpgButton>
                  <RpgButton variant="ghost">Ghost</RpgButton>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                  <RpgButton size="sm">Small</RpgButton>
                  <RpgButton size="default">Default</RpgButton>
                  <RpgButton size="lg">Large</RpgButton>
                  <RpgButton size="xl">Extra Large</RpgButton>
                </div>
              </RpgCardContent>
            </RpgCard>

            <RpgCard variant="elevated">
              <RpgCardHeader>
                <RpgCardTitle>Herní varianty</RpgCardTitle>
                <RpgCardDescription>
                  Speciální tlačítka pro quest a achievementy
                </RpgCardDescription>
              </RpgCardHeader>
              <RpgCardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <RpgButton variant="quest" icon={<QuestIcon />}>
                    Zahájit Quest
                  </RpgButton>
                  <RpgButton variant="achievement" icon={<Trophy />}>
                    Odemknout Achievement
                  </RpgButton>
                  <RpgButton variant="default" glow icon={<Sparkles />}>
                    Svítící efekt
                  </RpgButton>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <RpgButton loading>Načítání...</RpgButton>
                  <RpgButton disabled>Neaktivní</RpgButton>
                  <RpgButton icon={<Zap />} iconPosition="left">
                    S ikonou vlevo
                  </RpgButton>
                  <RpgButton icon={<Zap />} iconPosition="right">
                    S ikonou vpravo
                  </RpgButton>
                </div>
              </RpgCardContent>
            </RpgCard>
          </div>
        )}

        {/* Cards Section */}
        {selectedTab === "cards" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <RpgCard variant="default">
                <RpgCardHeader>
                  <RpgCardTitle>Základní karta</RpgCardTitle>
                  <RpgCardDescription>
                    Univerzální karta s jemným stínem
                  </RpgCardDescription>
                </RpgCardHeader>
                <RpgCardContent>
                  <p className="text-sm text-muted-foreground">
                    Toto je obsah karty. Můžete sem umístit jakýkoliv obsah.
                  </p>
                </RpgCardContent>
              </RpgCard>

              <QuestCard>
                <RpgCardHeader>
                  <RpgCardTitle>Quest karta</RpgCardTitle>
                  <RpgCardDescription>
                    Karta pro zobrazení úkolů
                  </RpgCardDescription>
                </RpgCardHeader>
                <RpgCardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Cíl:</p>
                    <p className="text-sm text-muted-foreground">
                      Dokončit 5 úkolů z matematiky
                    </p>
                    <div className="flex gap-2 mt-4">
                      <XpBadge xp={100} />
                      <RpgBadge variant="gold" icon={<CoinIcon className="w-3 h-3" />}>
                        50
                      </RpgBadge>
                    </div>
                  </div>
                </RpgCardContent>
              </QuestCard>

              <AchievementCard unlocked>
                <RpgCardHeader>
                  <RpgCardTitle>Achievement</RpgCardTitle>
                  <RpgCardDescription>
                    Odemčený úspěch
                  </RpgCardDescription>
                </RpgCardHeader>
                <RpgCardContent>
                  <div className="flex items-center gap-3">
                    <RpgIcon variant="gold" size="lg">
                      <Trophy className="w-6 h-6" />
                    </RpgIcon>
                    <div>
                      <p className="font-semibold">První krok</p>
                      <p className="text-sm text-muted-foreground">
                        Dokončil jsi první lekci!
                      </p>
                    </div>
                  </div>
                </RpgCardContent>
              </AchievementCard>

              <AchievementCard unlocked={false}>
                <RpgCardHeader>
                  <RpgCardTitle>Uzamčený achievement</RpgCardTitle>
                  <RpgCardDescription>
                    Ještě nedosaženo
                  </RpgCardDescription>
                </RpgCardHeader>
                <RpgCardContent>
                  <div className="flex items-center gap-3">
                    <RpgIcon variant="secondary" size="lg">
                      <Trophy className="w-6 h-6" />
                    </RpgIcon>
                    <div>
                      <p className="font-semibold">Mistr studia</p>
                      <p className="text-sm text-muted-foreground">
                        Dokončit 100 lekcí
                      </p>
                    </div>
                  </div>
                </RpgCardContent>
              </AchievementCard>

              <RpgCard variant="glass">
                <RpgCardHeader>
                  <RpgCardTitle>Glass efekt</RpgCardTitle>
                  <RpgCardDescription>
                    Průhledná karta s rozmazáním
                  </RpgCardDescription>
                </RpgCardHeader>
                <RpgCardContent>
                  <p className="text-sm text-muted-foreground">
                    Ideální pro overlay nebo popup okna
                  </p>
                </RpgCardContent>
              </RpgCard>

              <RpgCard variant="inventory">
                <RpgCardHeader>
                  <RpgCardTitle>Inventář styl</RpgCardTitle>
                  <RpgCardDescription>
                    Pro zobrazení předmětů
                  </RpgCardDescription>
                </RpgCardHeader>
                <RpgCardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <InventorySlot>
                      <PotionIcon className="w-8 h-8 text-red-500" />
                    </InventorySlot>
                    <InventorySlot>
                      <SwordIcon className="w-8 h-8 text-slate-400" />
                    </InventorySlot>
                    <InventorySlot empty />
                  </div>
                </RpgCardContent>
              </RpgCard>
            </div>
          </div>
        )}

        {/* Badges Section */}
        {selectedTab === "badges" && (
          <div className="space-y-8">
            <RpgCard variant="elevated">
              <RpgCardHeader>
                <RpgCardTitle>Základní odznaky</RpgCardTitle>
                <RpgCardDescription>
                  Různé varianty odznaků
                </RpgCardDescription>
              </RpgCardHeader>
              <RpgCardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <RpgBadge variant="default">Default</RpgBadge>
                  <RpgBadge variant="secondary">Secondary</RpgBadge>
                  <RpgBadge variant="accent">Accent</RpgBadge>
                  <RpgBadge variant="destructive">Destructive</RpgBadge>
                  <RpgBadge variant="outline">Outline</RpgBadge>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <RpgBadge variant="gold">Gold</RpgBadge>
                  <RpgBadge variant="silver">Silver</RpgBadge>
                  <RpgBadge variant="bronze">Bronze</RpgBadge>
                </div>
              </RpgCardContent>
            </RpgCard>

            <RpgCard variant="elevated">
              <RpgCardHeader>
                <RpgCardTitle>Rarity odznaky</RpgCardTitle>
                <RpgCardDescription>
                  Odznaky vzácnosti předmětů
                </RpgCardDescription>
              </RpgCardHeader>
              <RpgCardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <RarityBadge rarity="common" />
                  <RarityBadge rarity="rare" />
                  <RarityBadge rarity="epic" />
                  <RarityBadge rarity="legendary" />
                </div>
              </RpgCardContent>
            </RpgCard>

            <RpgCard variant="elevated">
              <RpgCardHeader>
                <RpgCardTitle>Herní odznaky</RpgCardTitle>
                <RpgCardDescription>
                  Speciální odznaky pro level, XP a status
                </RpgCardDescription>
              </RpgCardHeader>
              <RpgCardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Level odznaky:</p>
                  <div className="flex flex-wrap gap-2">
                    <LevelBadge level={1} />
                    <LevelBadge level={10} />
                    <LevelBadge level={50} />
                    <LevelBadge level={99} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-semibold">XP odznaky:</p>
                  <div className="flex flex-wrap gap-2">
                    <XpBadge xp={10} />
                    <XpBadge xp={50} />
                    <XpBadge xp={100} />
                    <XpBadge xp={500} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Status odznaky:</p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status="active" />
                    <StatusBadge status="completed" />
                    <StatusBadge status="locked" />
                    <StatusBadge status="failed" />
                  </div>
                </div>
              </RpgCardContent>
            </RpgCard>
          </div>
        )}

        {/* Icons Section */}
        {selectedTab === "icons" && (
          <div className="space-y-8">
            <RpgCard variant="elevated">
              <RpgCardHeader>
                <RpgCardTitle>RPG Ikony</RpgCardTitle>
                <RpgCardDescription>
                  Kolekce ikon pro herní rozhraní
                </RpgCardDescription>
              </RpgCardHeader>
              <RpgCardContent>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="primary">
                      <ShieldIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Shield</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="destructive">
                      <SwordIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Sword</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="secondary">
                      <ScrollIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Scroll</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="accent">
                      <CrystalIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Crystal</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="gold" glow>
                      <StarIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Star</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="gold">
                      <CrownIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Crown</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="gold">
                      <CoinIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Coin</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="accent" glow>
                      <GemIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Gem</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="destructive">
                      <PotionIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Potion</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="bronze">
                      <ChestIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Chest</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="primary">
                      <QuestIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Quest</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="secondary">
                      <BookIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Book</span>
                  </div>
                </div>
              </RpgCardContent>
            </RpgCard>

            <RpgCard variant="elevated">
              <RpgCardHeader>
                <RpgCardTitle>Velikosti ikon</RpgCardTitle>
                <RpgCardDescription>
                  Různé velikosti pro různé účely
                </RpgCardDescription>
              </RpgCardHeader>
              <RpgCardContent>
                <div className="flex items-end gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="gold" size="sm">
                      <CrownIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Small</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="gold" size="md">
                      <CrownIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Medium</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="gold" size="lg">
                      <CrownIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">Large</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <RpgIcon variant="gold" size="xl">
                      <CrownIcon />
                    </RpgIcon>
                    <span className="text-xs text-muted-foreground">XL</span>
                  </div>
                </div>
              </RpgCardContent>
            </RpgCard>
          </div>
        )}

        {/* Footer */}
        <RpgCard variant="glass" className="text-center">
          <RpgCardContent className="py-8">
            <p className="text-sm text-muted-foreground">
              Všechny komponenty jsou plně responzivní a podporují dark mode
            </p>
          </RpgCardContent>
        </RpgCard>
      </div>
    </div>
  )
}
