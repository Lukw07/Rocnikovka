/**
 * Event System Demo Script
 * 
 * Tento skript demonstruje všechny funkce event systému.
 * Použití: node ops/demo-event-system.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🎮 Event System Demo\n')

  // 1. Vytvoření operátora (pokud neexistuje)
  console.log('1️⃣  Kontrola/vytvoření operátora...')
  let operator = await prisma.user.findFirst({
    where: { role: 'OPERATOR' }
  })

  if (!operator) {
    operator = await prisma.user.create({
      data: {
        email: 'operator@edurpg.cz',
        name: 'System Operator',
        role: 'OPERATOR'
      }
    })
    console.log('   ✅ Operator vytvořen')
  } else {
    console.log('   ✅ Operator existuje')
  }

  // 2. Vytvoření testovacího studenta
  console.log('\n2️⃣  Vytvoření testovacího studenta...')
  let student = await prisma.user.upsert({
    where: { email: 'student.test@edurpg.cz' },
    update: {},
    create: {
      email: 'student.test@edurpg.cz',
      name: 'Test Student',
      role: 'STUDENT',
      grade: 10
    }
  })
  console.log('   ✅ Student připraven:', student.name)

  // 3. Vytvoření časově omezeného eventu
  console.log('\n3️⃣  Vytvoření časově omezeného eventu...')
  const timedEvent = await prisma.event.create({
    data: {
      title: 'Double XP Weekend',
      description: 'Získej dvojnásobné XP za všechny aktivity!',
      type: 'TIMED',
      category: 'SPECIAL',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dny
      xpBonus: 1000,
      coinReward: 500,
      isActive: true
    }
  })
  console.log('   ✅ Event vytvořen:', timedEvent.title)
  console.log('      ID:', timedEvent.id)

  // 4. Vytvoření story eventu s fázemi
  console.log('\n4️⃣  Vytvoření story eventu...')
  const storyEvent = await prisma.event.create({
    data: {
      title: 'Tajemství staré knihovny',
      description: 'Odhal tajemství ukryté v zapomenuté knihovně školy',
      type: 'STORY',
      category: 'ACADEMIC',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dní
      xpBonus: 2000,
      coinReward: 1000,
      storyContent: `# Kapitola 1: Objevení

Při úklidu staré knihovny jsi našel prastarou mapu skrytou v zapomenuté knize.
Mapa ukazuje na tajnou místnost kdesi ve škole...`,
      isActive: true
    }
  })
  console.log('   ✅ Story event vytvořen:', storyEvent.title)

  // 5. Přidání fází ke story eventu
  console.log('\n5️⃣  Přidávání fází...')
  const phases = await prisma.$transaction([
    prisma.eventPhase.create({
      data: {
        eventId: storyEvent.id,
        phaseNumber: 1,
        title: 'Dešifrování mapy',
        description: 'Rozkóduj starý text na mapě',
        storyContent: 'Mapa obsahuje zvláštní symboly. Musíš je rozluštit...',
        xpReward: 200,
        coinReward: 100
      }
    }),
    prisma.eventPhase.create({
      data: {
        eventId: storyEvent.id,
        phaseNumber: 2,
        title: 'Hledání vstupu',
        description: 'Najdi skrytý vchod podle mapy',
        storyContent: 'Mapa tě vede k staré soše v hlavní hale...',
        xpReward: 300,
        coinReward: 150,
        unlockCondition: { minLevel: 5 }
      }
    }),
    prisma.eventPhase.create({
      data: {
        eventId: storyEvent.id,
        phaseNumber: 3,
        title: 'Tajná místnost',
        description: 'Prozkoumej tajnou místnost',
        storyContent: 'Za sochou je skrytý vchod. Otevíráš dveře a vstupuješ...',
        xpReward: 500,
        coinReward: 250
      }
    })
  ])
  console.log(`   ✅ Přidáno ${phases.length} fází`)

  // 6. Vytvoření boss eventu
  console.log('\n6️⃣  Vytvoření boss eventu...')
  const bossEvent = await prisma.event.create({
    data: {
      title: 'Střetnutí s Knihovním Dráčkem',
      description: 'Společně porazte strážce tajné knihovny!',
      type: 'BOSS_BATTLE',
      category: 'SPECIAL',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dní
      xpBonus: 3000,
      coinReward: 2000,
      isActive: true
    }
  })
  console.log('   ✅ Boss event vytvořen:', bossEvent.title)

  // 7. Vytvoření bosse
  console.log('\n7️⃣  Vytvoření bosse...')
  const boss = await prisma.boss.create({
    data: {
      name: 'Knihovní Dráček',
      description: 'Starý drak střežící prastaré znalosti',
      hp: 50000,
      maxHp: 50000,
      level: 30,
      xpReward: 5000,
      moneyReward: 5000,
      isActive: true
    }
  })
  console.log('   ✅ Boss vytvořen:', boss.name)
  console.log('      HP:', boss.hp)
  console.log('      Level:', boss.level)

  // 8. Propojení bosse s eventem
  await prisma.event.update({
    where: { id: bossEvent.id },
    data: { dungeonBossId: boss.id }
  })
  console.log('   ✅ Boss propojen s eventem')

  // 9. Simulace účasti studenta
  console.log('\n8️⃣  Simulace účasti studenta...')
  
  // Účast na časovém eventu
  const participation1 = await prisma.eventParticipation.create({
    data: {
      eventId: timedEvent.id,
      userId: student.id,
      progress: 0
    }
  })
  console.log('   ✅ Student se účastní:', timedEvent.title)

  // Účast na story eventu
  const participation2 = await prisma.eventParticipation.create({
    data: {
      eventId: storyEvent.id,
      userId: student.id,
      progress: 0,
      currentPhaseId: phases[0].id
    }
  })
  console.log('   ✅ Student se účastní:', storyEvent.title)

  // Účast na boss eventu
  const participation3 = await prisma.eventParticipation.create({
    data: {
      eventId: bossEvent.id,
      userId: student.id,
      progress: 0
    }
  })
  console.log('   ✅ Student se účastní:', bossEvent.title)

  // 10. Vytvoření notifikací
  console.log('\n9️⃣  Vytváření notifikací...')
  await prisma.notification.createMany({
    data: [
      {
        userId: student.id,
        type: 'EVENT_STARTED',
        title: `Event Started: ${timedEvent.title}`,
        message: timedEvent.description || 'New event!',
        data: { eventId: timedEvent.id }
      },
      {
        userId: student.id,
        type: 'EVENT_STARTED',
        title: `Event Started: ${storyEvent.title}`,
        message: storyEvent.description || 'New story event!',
        data: { eventId: storyEvent.id }
      },
      {
        userId: student.id,
        type: 'BOSS_SPAWNED',
        title: `Boss Fight: ${boss.name}`,
        message: `Level ${boss.level} - HP: ${boss.hp}`,
        data: { eventId: bossEvent.id, bossId: boss.id }
      }
    ]
  })
  console.log('   ✅ Notifikace vytvořeny')

  // 11. Statistiky
  console.log('\n🔟 Souhrn:\n')
  const eventCount = await prisma.event.count({ where: { isActive: true } })
  const participationCount = await prisma.eventParticipation.count()
  const phaseCount = await prisma.eventPhase.count()
  const bossCount = await prisma.boss.count({ where: { isActive: true } })

  console.log(`   📊 Celkem aktivních eventů: ${eventCount}`)
  console.log(`   👥 Celkem účastí: ${participationCount}`)
  console.log(`   📖 Celkem story fází: ${phaseCount}`)
  console.log(`   🐉 Celkem aktivních bossů: ${bossCount}`)

  console.log('\n✅ Demo dokončeno!\n')
  console.log('📝 Další kroky:')
  console.log('   1. Spusť aplikaci: npm run dev')
  console.log('   2. Přejdi na: http://localhost:3000/dashboard/events')
  console.log('   3. Přihlas se jako student: student.test@edurpg.cz')
  console.log('   4. Prohlédni si eventy a vyzkoušej funkce!\n')
}

main()
  .catch((e) => {
    console.error('❌ Chyba při demo:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
