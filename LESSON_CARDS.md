# ClassCard a LessonCard - Dokumentace

Tyto komponenty jsou speciálně navrženy pro zobrazování tříd a lekcí v EduRPG.

## ClassCard - Karta pro třídu/předmět

Dvousloupcový layout s názvem vlevo a metadaty vpravo.

### Props
```typescript
interface ClassCardProps extends RpgCardProps {
  title: string           // Název třídy
  students?: number       // Počet studentů
  xp?: string            // XP reward (např. "100/100")
  date?: string          // Datum (např. "3.4.")
  duration?: string      // Trvání (např. "1h")
}
```

### Příklady

```tsx
import { ClassCard } from "@/app/components/ui/rpg-lesson-cards"

// Jednoduchá třída
<ClassCard 
  title="ČJL 4ITB"
  students={24}
  xp="100/100"
  date="3.4."
  duration="1h"
/>

// S vlastním obsahem
<ClassCard 
  title="Anglický jazyk"
  students={22}
  xp="85/100"
  date="4.4."
  duration="1.5h"
>
  <p className="text-sm text-muted-foreground mt-2">
    Pokročilá úroveň
  </p>
</ClassCard>

// Bez některých metadat
<ClassCard 
  title="Matematika 4ITB"
  students={24}
  date="5.4."
/>
```

---

## LessonCard - Karta pro lekci

Jednoduchý layout s ikonou/číslem, názvem a detaily v řádku.

### Props
```typescript
interface LessonCardProps extends RpgCardProps {
  number?: string | number  // Číslo kapitoly/lekce
  title: string            // Název lekce
  teacher?: string         // Jméno vyučujícího/kuratora
  date?: string           // Datum lekce
  duration?: string       // Trvání lekce
  icon?: React.ReactNode  // Custom ikona (místo čísla)
}
```

### Příklady

```tsx
import { LessonCard } from "@/app/components/ui/rpg-lesson-cards"

// S číslem
<LessonCard 
  number={7}
  title="Český jazyk"
  teacher="Kurátor"
  date="3.4."
  duration="1h"
/>

// S custom ikonou
<LessonCard 
  icon="∫"
  title="Základy Integrálního počtu"
  teacher="Prof. Novák"
  date="5.4."
  duration="2h"
/>

// Emoji ikona
<LessonCard 
  icon="🔬"
  title="Chemické reakce"
  teacher="Dr. Svobodová"
  date="6.4."
  duration="1h"
/>

// Minimální verze
<LessonCard 
  number="A1"
  title="Úvod do Angličtiny"
/>
```

---

## Responsivní layout

Oba typy karet jsou plně responsivní:

```tsx
// Pro gridy
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <LessonCard number={1} title="Lekce 1" />
  <LessonCard number={2} title="Lekce 2" />
  <LessonCard number={3} title="Lekce 3" />
</div>

// Pro vertikální seznam
<div className="space-y-4">
  <ClassCard title="Třída A" students={24} />
  <ClassCard title="Třída B" students={22} />
  <ClassCard title="Třída C" students={20} />
</div>
```

---

## Dark Mode

Obě komponenty automaticky podporují dark mode. Barvy se přizpůsobují na základě CSS proměnných:

- **Primární barva**: Indigo (light) / Jasný indigo (dark)
- **Accent**: Cyan (light) / Jasný cyan (dark)
- **Text**: Tmavý (light) / Světlý (dark)

---

## Styling & Customizace

Obě komponenty používají `RpgCard` s variantou `"default"`, takže mají:
- Viditelný ornamentální top border (gradient purple→cyan)
- Plynulé shadow efekty
- Hover animace (posunutí nahoru)

Pro custom styling:

```tsx
<ClassCard 
  title="Custom"
  className="ring-2 ring-primary/50"
/>

<LessonCard 
  number={1}
  title="Custom"
  className="bg-gradient-to-r from-primary/10 to-accent/10"
/>
```
