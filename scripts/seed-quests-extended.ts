
import { PrismaClient, QuestType, QuestDifficulty, FriendQuestType, UserRole } from '../app/lib/generated';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding quests...');

  // 1. Find or create a creator (Teacher/Admin)
  let creator = await prisma.user.findFirst({
    where: { role: { in: [UserRole.TEACHER, UserRole.OPERATOR] } }
  });

  if (!creator) {
    console.log('No teacher/admin found. Creating one...');
    creator = await prisma.user.create({
      data: {
        email: 'system.teacher@edurpg.local',
        name: 'System Teacher',
        role: UserRole.TEACHER,
        bakalariId: 'sys_teacher_01' // Mock ID
      }
    });
  }

  console.log(`Using creator: ${creator.name} (${creator.id})`);

  // 2. Create Daily Quests
  const dailyQuests = [
    {
      title: 'Daily Attendance',
      description: 'Mark your attendance in the system today.',
      category: 'Routine',
      difficulty: QuestDifficulty.EASY,
      questType: QuestType.DAILY,
      xpReward: 50,
      moneyReward: 10,
      requiredLevel: 0,
      createdBy: creator.id
    },
    {
      title: 'Answer 3 Questions',
      description: 'Correctly answer 3 standard questions.',
      category: 'Academic',
      difficulty: QuestDifficulty.MEDIUM,
      questType: QuestType.DAILY,
      xpReward: 100,
      moneyReward: 20,
      requiredLevel: 0,
      createdBy: creator.id
    },
    {
      title: 'Help a Classmate',
      description: 'Assist another student with a task.',
      category: 'Social',
      difficulty: QuestDifficulty.EASY,
      questType: QuestType.DAILY,
      xpReward: 75,
      moneyReward: 15,
      requiredLevel: 0,
      createdBy: creator.id
    }
  ];

  for (const q of dailyQuests) {
    const exists = await prisma.quest.findFirst({
      where: { title: q.title, questType: QuestType.DAILY }
    });
    if (!exists) {
      await prisma.quest.create({ data: q });
      console.log(`Created Daily Quest: ${q.title}`);
    } else {
      console.log(`Daily Quest exists: ${q.title}`);
    }
  }

  // 3. Create Friend Quests
  const friendQuests = [
    {
      title: 'Study Buddy',
      description: 'Study together for 30 minutes in the library area.',
      category: 'Social',
      difficulty: QuestDifficulty.EASY,
      questType: FriendQuestType.WEEKLY,
      xpReward: 200, // Reward is stored in FriendQuestCompletion/Reward usually, but strictly Model has no xpReward field on FriendQuest itself?
      // Wait, FriendQuest model has `rewards FriendQuestReward[]`. It does not have `xpReward` directly.
      // I should check FriendQuest model again. It has rewards relation.
      createdBy: creator.id
    },
    {
      title: 'Sync Coding',
      description: 'Complete a coding challenge together.',
      category: 'Tech',
      difficulty: QuestDifficulty.MEDIUM,
      questType: FriendQuestType.WEEKLY,
      createdBy: creator.id
    }
  ];

  for (const q of friendQuests) {
    // I need to separate rewards from creation if Model doesn't support xpReward directly.
    // The schema showed FriendQuestReward model.
    const exists = await prisma.friendQuest.findFirst({
      where: { title: q.title }
    });

    if (!exists) {
      const fq = await prisma.friendQuest.create({
        data: {
          title: q.title,
          description: q.description,
          category: q.category,
          difficulty: q.difficulty,
          questType: q.questType,
          createdBy: q.createdBy,
          rewards: {
            create: [
              { rewardType: 'XP', amount: 300 },
              { rewardType: 'MONEY', amount: 50 }
            ]
          }
        }
      });
      console.log(`Created Friend Quest: ${q.title}`);
    } else {
       console.log(`Friend Quest exists: ${q.title}`);
    }
  }

  // 4. Create Guild Quests
  // Need a guild logic. I'll search for a guild.
  const guild = await prisma.guild.findFirst();
  if (guild) {
    const guildQuests = [
      {
        title: 'Guild Meeting',
        description: 'All members gather at guild hall.',
        category: 'Guild',
        difficulty: QuestDifficulty.EASY,
        questType: QuestType.GUILD,
        xpReward: 100,
        moneyReward: 50,
        requiredLevel: 1,
        guildId: guild.id,
        createdBy: creator.id
      }
    ];

    for (const q of guildQuests) {
       const exists = await prisma.quest.findFirst({
        where: { title: q.title, guildId: guild.id }
      });
      if (!exists) {
        await prisma.quest.create({ data: q });
        console.log(`Created Guild Quest: ${q.title} for guild ${guild.name}`);
      } else {
        console.log(`Guild Quest exists: ${q.title}`);
      }
    }
  } else {
    console.log('No guild found, skipping Guild Quest creation.');
    // Create a generic guild quest with NO guildId?
    // Based on my service logic, it requires guildId to match.
    // If I create one with null guildId, it might not be visible unless I detailed filters.
    // I'll skip for now.
  }

  // 5. Create Global Quests
  const globalQuests = [
    {
      title: 'School Excellence 2026',
      description: 'Collectively achieve 10,000 grade 1s (A) across all subjects.',
      category: 'Global',
      difficulty: QuestDifficulty.LEGENDARY,
      questType: QuestType.GLOBAL,
      xpReward: 5000,
      moneyReward: 1000,
      requiredLevel: 0,
      globalTarget: 10000,
      globalUnit: 'grades_1',
      createdBy: creator.id
    },
    {
      title: 'Mass Attendance',
      description: 'Accumulate 100,000 school hours collectively.',
      category: 'Global',
      difficulty: QuestDifficulty.HARD,
      questType: QuestType.GLOBAL,
      xpReward: 3000,
      moneyReward: 500,
      requiredLevel: 0,
      globalTarget: 100000,
      globalUnit: 'hours',
      createdBy: creator.id
    },
     {
      title: 'World Boss Challenge',
      description: 'Deal 1,000,000 damage to the Dark Lord.',
      category: 'Global',
      difficulty: QuestDifficulty.LEGENDARY,
      questType: QuestType.GLOBAL,
      xpReward: 10000,
      moneyReward: 2000,
      requiredLevel: 5,
      globalTarget: 1000000,
      globalUnit: 'hp_damage',
      createdBy: creator.id
    }
  ];

  for (const q of globalQuests) {
    const exists = await prisma.quest.findFirst({
      where: { title: q.title, questType: QuestType.GLOBAL }
    });
    if (!exists) {
      await prisma.quest.create({ data: q });
      console.log(`Created Global Quest: ${q.title}`);
    } else {
      // Update existing if needed (e.g. to ensure fields are set)
      await prisma.quest.update({
        where: { id: exists.id },
        data: {
            globalTarget: q.globalTarget,
            globalUnit: q.globalUnit,
            questType: QuestType.GLOBAL // Ensure type is set
        }
      });
      console.log(`Updated Global Quest: ${q.title}`);
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
