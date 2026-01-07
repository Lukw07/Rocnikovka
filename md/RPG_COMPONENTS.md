# RPG Komponenty - Dokumentace

Moderní herní rozhraní ve stylu RPG pro EduRPG aplikaci. Design působí jako herní prostředí, ale zůstává přehledný, čistý a profesionální.

## 🎨 Vizuální styl

### Inspirace
- RPG hry (quest log, inventář, herní menu, achievementy)
- Fantasy / light-fantasy / medieval-tech
- Ne cartoon, ne pixel art
- Rozhraní působí jako herní HUD, ne jako klasická admin aplikace

### Barevnost
- **Primární barva**: Zlatá / bronzová (akcenty, důležité prvky)
- **Sekundární**: Tmavá šedá / grafit / kámen
- **Pozadí**:
  - Dark mode: tmavé kamenné textury (velmi jemné)
  - Light mode: pergamen / světlý kámen
- Žádné křiklavé barvy, žádné neonové přechody

## 📦 Komponenty

### RpgButton

Tlačítka s plastickým vzhledem, jemnými stíny a smooth animacemi.

#### Varianty:
- `default` - Primární tlačítko se zlatým gradientem
- `secondary` - Sekundární tlačítko
- `accent` - Akcentní tlačítko (modrá)
- `destructive` - Destruktivní akce (červená)
- `outline` - Obrysové tlačítko
- `ghost` - Průhledné tlačítko
- `quest` - Speciální pro questy (jantarová)
- `achievement` - Speciální pro achievementy (fialová)

#### Velikosti:
- `sm` - Malé (h-9)
- `default` - Výchozí (h-10)
- `lg` - Velké (h-12)
- `xl` - Extra velké (h-14)
- `icon` - Čtvercové pro ikony (10x10)

#### Příklady použití:

```tsx
import { RpgButton } from "@/app/components/ui/rpg-button"
import { Sparkles } from "lucide-react"

// Základní použití
<RpgButton>Klikni</RpgButton>

// S variantou a velikostí
<RpgButton variant="quest" size="lg">
  Zahájit Quest
</RpgButton>

// S ikonou
<RpgButton icon={<Sparkles />} iconPosition="left">
  Magická akce
</RpgButton>

// Se svítícím efektem
<RpgButton variant="default" glow>
  Důležité tlačítko
</RpgButton>

// Loading stav
<RpgButton loading>
  Načítání...
</RpgButton>

// Neaktivní
<RpgButton disabled>
  Nedostupné
</RpgButton>
```

---

### RpgCard

Karty připomínající herní quest log / inventář s elegantními okraji.

#### Varianty:
- `default` - Základní karta s jemným stínem
- `quest` - Karta ve stylu questu (jantarová)
- `achievement` - Karta ve stylu achievementu (fialová)
- `inventory` - Karta pro inventář
- `glass` - Průhledná karta s blur efektem
- `elevated` - Karta se zvýrazněným stínem

#### Speciální karty:
- `QuestCard` - Automaticky quest varianta s notifikačním bodem
- `AchievementCard` - Achievement s možností zobrazit odemčený stav
- `InventorySlot` - Slot pro předměty v inventáři

#### Příklady použití:

```tsx
import { 
  RpgCard, 
  RpgCardHeader, 
  RpgCardTitle, 
  RpgCardDescription, 
  RpgCardContent,
  QuestCard,
  AchievementCard,
  InventorySlot
} from "@/app/components/ui/rpg-card"

// Základní karta
<RpgCard>
  <RpgCardHeader>
    <RpgCardTitle>Nadpis karty</RpgCardTitle>
    <RpgCardDescription>Popis karty</RpgCardDescription>
  </RpgCardHeader>
  <RpgCardContent>
    Obsah karty
  </RpgCardContent>
</RpgCard>

// Quest karta s notifikací
<QuestCard>
  <RpgCardHeader>
    <RpgCardTitle>Dokončit úkoly</RpgCardTitle>
    <RpgCardDescription>5/10 úkolů hotovo</RpgCardDescription>
  </RpgCardHeader>
  <RpgCardContent>
    <p>Zbývá dokončit ještě 5 úkolů z matematiky</p>
  </RpgCardContent>
</QuestCard>

// Achievement karta
<AchievementCard unlocked={true}>
  <RpgCardHeader>
    <RpgCardTitle>První krok</RpgCardTitle>
    <RpgCardDescription>Dokončil jsi první lekci!</RpgCardDescription>
  </RpgCardHeader>
</AchievementCard>

// Inventář slot
<InventorySlot>
  <PotionIcon className="w-8 h-8 text-red-500" />
</InventorySlot>

<InventorySlot empty /> {/* Prázdný slot */}

// Glass karta
<RpgCard variant="glass">
  <RpgCardContent>
    Průhledný obsah
  </RpgCardContent>
</RpgCard>

// Interaktivní karta
<RpgCard interactive onClick={() => console.log('click')}>
  <RpgCardContent>
    Klikací karta
  </RpgCardContent>
</RpgCard>
```

---

### RpgBadge

Odznaky ve stylu achievementů a pečetí.

#### Varianty:
- `default` - Primární badge (zlatý)
- `secondary` - Sekundární badge
- `accent` - Akcentní badge (modrý)
- `destructive` - Destruktivní badge (červený)
- `outline` - Obrysový badge
- `gold` - Zlatý badge
- `silver` - Stříbrný badge
- `bronze` - Bronzový badge
- `rare` - Vzácný (modrý)
- `epic` - Epický (fialový)
- `legendary` - Legendární (zlatooranžový s glow)

#### Speciální badges:
- `LevelBadge` - Zobrazení levelu
- `XpBadge` - Zobrazení získaných XP
- `RarityBadge` - Vzácnost předmětu
- `StatusBadge` - Status questu/úkolu

#### Příklady použití:

```tsx
import { 
  RpgBadge, 
  LevelBadge, 
  XpBadge, 
  RarityBadge, 
  StatusBadge 
} from "@/app/components/ui/rpg-badge"
import { Star } from "lucide-react"

// Základní badge
<RpgBadge>Nový</RpgBadge>

// S ikonou
<RpgBadge variant="gold" icon={<Star className="w-3 h-3" />}>
  Premium
</RpgBadge>

// Level badge
<LevelBadge level={42} />

// XP badge
<XpBadge xp={100} />

// Rarity badge
<RarityBadge rarity="legendary" />

// Status badge
<StatusBadge status="completed" />
<StatusBadge status="active" />
<StatusBadge status="locked" />
<StatusBadge status="failed" />
```

---

### RpgIcon

Wrapper pro ikony s konzistentním stylem a RPG set ikon.

#### Dostupné ikony:
- `ShieldIcon` - Štít
- `SwordIcon` - Meč
- `ScrollIcon` - Svitek
- `CrystalIcon` - Krystal
- `StarIcon` - Hvězda
- `CrownIcon` - Koruna
- `CoinIcon` - Mince
- `GemIcon` - Drahokam
- `PotionIcon` - Lektvar
- `ChestIcon` - Truhlice
- `QuestIcon` - Quest
- `BookIcon` - Kniha

#### Příklady použití:

```tsx
import { 
  RpgIcon,
  ShieldIcon,
  SwordIcon,
  CrownIcon,
  GemIcon
} from "@/app/components/ui/rpg-icons"

// Základní icon wrapper
<RpgIcon variant="primary" size="md">
  <ShieldIcon />
</RpgIcon>

// Zlatá ikona s glow efektem
<RpgIcon variant="gold" size="lg" glow>
  <CrownIcon />
</RpgIcon>

// Různé velikosti
<RpgIcon size="sm"><SwordIcon /></RpgIcon>
<RpgIcon size="md"><SwordIcon /></RpgIcon>
<RpgIcon size="lg"><SwordIcon /></RpgIcon>
<RpgIcon size="xl"><SwordIcon /></RpgIcon>

// Přímo použití ikon
<GemIcon className="w-6 h-6 text-purple-500" />
```

---

## 🎭 Typografie

```tsx
// Nadpisy - font Cinzel (fantasy styl)
<h1 className="font-cinzel text-4xl font-bold">Hlavní nadpis</h1>
<h2 className="font-cinzel text-3xl font-semibold">Podnadpis</h2>

// Text - font Inter (moderní sans-serif)
<p className="font-inter">Běžný text pro čitelnost</p>
```

---

## 🎨 CSS utility třídy

### Glass efekt
```tsx
<div className="glass-effect">
  Průhledný obsah s blur efektem
</div>
```

### RPG Button styl (pro custom elementy)
```tsx
<div className="rpg-button">
  Custom tlačítko s RPG stylem
</div>
```

### RPG Card styl (pro custom elementy)
```tsx
<div className="rpg-card">
  Custom karta s RPG stylem
</div>
```

### Glow efekt při hoveru
```tsx
<div className="glow-on-hover">
  Element se svítícím efektem
</div>
```

### Quest item (s tečkou)
```tsx
<div className="quest-item">
  Quest položka s notifikační tečkou
</div>
```

---

## 🌈 Tailwind utility

### Animace
- `animate-fade-in` - Pozvolný fade in
- `animate-fade-out` - Pozvolný fade out
- `animate-slide-in-up` - Slide nahoru
- `animate-slide-in-down` - Slide dolů
- `animate-glow` - Pulzující glow
- `animate-shimmer` - Shimmer efekt
- `animate-float` - Plovoucí pohyb

### Stíny
- `shadow-rpg` - Základní RPG stín
- `shadow-rpg-lg` - Velký RPG stín
- `shadow-rpg-inner` - Vnitřní stín
- `shadow-gold` - Zlatý stín
- `shadow-glow-primary` - Glow s primární barvou
- `shadow-glow-accent` - Glow s akcentní barvou

### Textury
- `bg-texture-stone` - Kamenná textura (dark mode)
- `bg-texture-parchment` - Pergamenová textura (light mode)

---

## 📱 Responzivita

Všechny komponenty jsou plně responzivní:

```tsx
// Responzivní grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <RpgCard>...</RpgCard>
  <RpgCard>...</RpgCard>
  <RpgCard>...</RpgCard>
</div>

// Responzivní velikosti
<RpgButton size="sm" className="md:size-default lg:size-lg">
  Responzivní tlačítko
</RpgButton>
```

---

## 🌓 Dark Mode

Všechny komponenty automaticky podporují dark mode:

```tsx
// Komponenty se automaticky adaptují
<RpgCard>
  Tato karta bude vypadat dobře v light i dark režimu
</RpgCard>

// Custom barvy respektující theme
<div className="bg-background text-foreground">
  <h1 className="text-primary">Nadpis</h1>
  <p className="text-muted-foreground">Popis</p>
</div>
```

---

## 🎯 Best Practices

### 1. Používejte správné varianty
```tsx
// ✅ Správně
<RpgButton variant="quest">Zahájit Quest</RpgButton>
<RpgButton variant="destructive">Smazat</RpgButton>

// ❌ Špatně
<RpgButton variant="quest">Smazat</RpgButton>
```

### 2. Konzistence ikon
```tsx
// ✅ Správně - používejte RPG ikony kde to dává smysl
<RpgIcon variant="gold"><CoinIcon /></RpgIcon>

// ❌ Špatně - nemixujte styly
<div className="random-icon-style"><SomeIcon /></div>
```

### 3. Správná hierarchie
```tsx
// ✅ Správně
<RpgCard>
  <RpgCardHeader>
    <RpgCardTitle>Nadpis</RpgCardTitle>
    <RpgCardDescription>Popis</RpgCardDescription>
  </RpgCardHeader>
  <RpgCardContent>Obsah</RpgCardContent>
  <RpgCardFooter>Footer</RpgCardFooter>
</RpgCard>
```

### 4. Používejte specializované komponenty
```tsx
// ✅ Správně
<QuestCard>...</QuestCard>
<AchievementCard unlocked>...</AchievementCard>

// ❌ Méně efektivní
<RpgCard variant="quest">
  <div className="absolute...">!</div>
  ...
</RpgCard>
```

---

## 🚀 Živá ukázka

Pro zobrazení všech komponent navštivte:
```
/rpg-showcase
```

---

## 💡 Tipy

1. **Jemnost je klíč** - Animace jsou pomalé (200-300ms), ne rychlé
2. **Méně je více** - Nepřeplňujte UI, nechte obsah dýchat
3. **Konzistence** - Používejte stejné varianty napříč aplikací
4. **Čitelnost** - Vždy testujte v obou režimech (light/dark)
5. **Animace s účelem** - Každá animace má svůj význam

---

## 🎮 Příklad komplexní stránky

```tsx
import { RpgButton } from "@/app/components/ui/rpg-button"
import { QuestCard, RpgCardHeader, RpgCardTitle, RpgCardContent } from "@/app/components/ui/rpg-card"
import { LevelBadge, XpBadge } from "@/app/components/ui/rpg-badge"
import { RpgIcon, QuestIcon } from "@/app/components/ui/rpg-icons"

export default function QuestsPage() {
  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-cinzel font-bold">Moje Questy</h1>
        <LevelBadge level={15} />
      </div>

      {/* Quest list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuestCard interactive>
          <RpgCardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <RpgIcon variant="primary">
                  <QuestIcon />
                </RpgIcon>
                <div>
                  <RpgCardTitle>Matematický maraton</RpgCardTitle>
                  <p className="text-sm text-muted-foreground">
                    Dokončit 10 úkolů
                  </p>
                </div>
              </div>
            </div>
          </RpgCardHeader>
          <RpgCardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <XpBadge xp={150} />
              </div>
              <RpgButton variant="quest" className="w-full">
                Pokračovat
              </RpgButton>
            </div>
          </RpgCardContent>
        </QuestCard>
      </div>
    </div>
  )
}
```

---

Vytvořeno pro **EduRPG** - Gamifikovaná vzdělávací platforma
