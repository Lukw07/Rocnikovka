
import { PrismaClient, QuestType, QuestDifficulty, UserRole } from '../app/lib/generated';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Guild...');

  // Find the teacher again or any user to be leader
  const leader = await prisma.user.findFirst({
    where: { role: { in: [UserRole.TEACHER, UserRole.OPERATOR] } }
  });

  if (!leader) {
    console.error('No leader found.');
    return;
  }

  // Create Guild
  const guildName = 'The Scholars';
  let guild = await prisma.guild.findFirst({
    where: { name: guildName }
  });

  if (!guild) {
    guild = await prisma.guild.create({
      data: {
        name: guildName,
        description: 'Elite students guild.',
        leaderId: leader.id,
        isPublic: true,
        members: {
          create: {
            userId: leader.id,
            role: 'LEADER'
          }
        }
      }
    });
    console.log(`Created Guild: ${guild.name}`);
  } else {
    console.log(`Guild exists: ${guild.name}`);
  }

  // Create Guild Quests
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
      createdBy: leader.id
    },
    {
       title: 'Treasury Contribution',
       description: 'Contribute 100 gold to the treasury.',
       category: 'Guild',
       difficulty: QuestDifficulty.MEDIUM,
       questType: QuestType.GUILD,
       xpReward: 200,
       moneyReward: 0,
       requiredLevel: 1,
       guildId: guild.id,
       createdBy: leader.id
    }
  ];

  for (const q of guildQuests) {
    const exists = await prisma.quest.findFirst({
      where: { title: q.title, guildId: guild.id }
    });
    if (!exists) {
      await prisma.quest.create({ data: q });
      console.log(`Created Guild Quest: ${q.title}`);
    } else {
      console.log(`Guild Quest exists: ${q.title}`);
    }
  }

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
