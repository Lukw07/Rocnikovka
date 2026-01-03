# Friends System - Integration Examples

## 🔗 Příklady integrace se stávajícími systémy

Tento dokument ukazuje, jak systém přátel spolupracuje s ostatními mechanikami EduRPG.

## 1. Guildy (Guilds System)

### Doporučování přátel při vytváření guildy

```typescript
// app/components/guilds/create-guild-form.tsx
import { getFriends } from '@/app/actions/friends';

export function CreateGuildForm() {
  const [friends, setFriends] = useState([]);
  
  useEffect(() => {
    async function loadFriends() {
      const result = await getFriends();
      if (result.success) {
        setFriends(result.friends);
      }
    }
    loadFriends();
  }, []);
  
  return (
    <div>
      <h3>Pozvat přátele do guildy</h3>
      {friends.map(friend => (
        <FriendInviteCard key={friend.id} friend={friend} />
      ))}
    </div>
  );
}
```

### Zobrazení společné guildy

```typescript
// app/components/friends/friend-card.tsx
export async function FriendCard({ friend }) {
  // Zjistíme, zda jsou v stejné guildě
  const sharedGuild = await prisma.guildMember.findFirst({
    where: {
      guildId: {
        in: await prisma.guildMember.findMany({
          where: { userId: friend.id },
          select: { guildId: true }
        }).then(guilds => guilds.map(g => g.guildId))
      },
      userId: currentUser.id
    },
    include: {
      guild: true
    }
  });
  
  return (
    <Card>
      {/* ... */}
      {sharedGuild && (
        <Badge>Společná guilda: {sharedGuild.guild.name}</Badge>
      )}
    </Card>
  );
}
```

## 2. Trading System

### Filtrování obchodů od přátel

```typescript
// app/api/trading/route.ts
export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const friendsOnly = searchParams.get('friendsOnly') === 'true';
  
  let whereClause = {};
  
  if (friendsOnly) {
    // Získáme ID všech přátel
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId1: session.user.id },
          { userId2: session.user.id }
        ]
      }
    });
    
    const friendIds = friendships.map(f => 
      f.userId1 === session.user.id ? f.userId2 : f.userId1
    );
    
    whereClause = {
      OR: [
        { requesterId: { in: friendIds } },
        { recipientId: { in: friendIds } }
      ]
    };
  }
  
  const trades = await prisma.trade.findMany({
    where: whereClause,
    // ...
  });
  
  return NextResponse.json({ trades });
}
```

### Trust bonus pro přátele

```typescript
// app/actions/trading.ts
export async function createTrade(recipientId: string, items: any[]) {
  const session = await auth();
  
  // Zkontrolujeme, zda je příjemce přítel
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId1: session.user.id, userId2: recipientId },
        { userId1: recipientId, userId2: session.user.id }
      ]
    }
  });
  
  const trade = await prisma.trade.create({
    data: {
      requesterId: session.user.id,
      recipientId,
      items,
      // Přátelé mají bonus na trust
      trustBonus: friendship ? 10 : 0
    }
  });
  
  return trade;
}
```

## 3. Events System

### Pozvánka přátel do event teamu

```typescript
// app/components/events/create-team.tsx
import { getFriends } from '@/app/actions/friends';

export function CreateEventTeam({ eventId }: { eventId: string }) {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  
  useEffect(() => {
    async function load() {
      const result = await getFriends();
      if (result.success) {
        setFriends(result.friends);
      }
    }
    load();
  }, []);
  
  async function createTeam() {
    await prisma.eventTeam.create({
      data: {
        eventId,
        members: {
          create: selectedFriends.map(friendId => ({
            userId: friendId,
            role: 'MEMBER'
          }))
        }
      }
    });
  }
  
  return (
    <div>
      <h3>Pozvat přátele do týmu</h3>
      {friends.map(friend => (
        <Checkbox
          key={friend.id}
          checked={selectedFriends.includes(friend.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedFriends([...selectedFriends, friend.id]);
            } else {
              setSelectedFriends(selectedFriends.filter(id => id !== friend.id));
            }
          }}
        >
          {friend.name}
        </Checkbox>
      ))}
      <Button onClick={createTeam}>Vytvořit tým</Button>
    </div>
  );
}
```

### Notifikace o eventových aktivitách přátel

```typescript
// app/api/events/[id]/join/route.ts
export async function POST(req: NextRequest, { params }) {
  const session = await auth();
  
  // Uživatel se připojí k eventu
  await prisma.eventParticipation.create({
    data: {
      userId: session.user.id,
      eventId: params.id
    }
  });
  
  // Notifikujeme přátele
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userId1: session.user.id },
        { userId2: session.user.id }
      ]
    }
  });
  
  const friendIds = friendships.map(f => 
    f.userId1 === session.user.id ? f.userId2 : f.userId1
  );
  
  await prisma.notification.createMany({
    data: friendIds.map(friendId => ({
      userId: friendId,
      type: 'FRIEND_EVENT_JOIN',
      title: 'Přítel se připojil k eventu',
      message: `${session.user.name} se připojil k eventu`,
      data: JSON.stringify({ eventId: params.id })
    }))
  });
  
  return NextResponse.json({ success: true });
}
```

## 4. Achievements System

### Achievement za počet přátel

```typescript
// ops/seed-achievements.ts (přidat)
{
  id: 'achievement_social_butterfly',
  title: 'Social Butterfly',
  description: 'Mějte 10 přátel',
  category: 'SOCIAL',
  rarity: 'RARE',
  xpReward: 100,
  criteria: {
    type: 'FRIENDS_COUNT',
    threshold: 10
  }
}
```

### Kontrola achievementů při přidání přítele

```typescript
// app/api/friends/requests/[id]/route.ts (přidat do PATCH)
export async function PATCH(req, { params }) {
  // ... stávající kód pro přijetí žádosti ...
  
  // Zkontrolujeme achievementy
  const friendCount = await prisma.friendship.count({
    where: {
      OR: [
        { userId1: session.user.id },
        { userId2: session.user.id }
      ]
    }
  });
  
  // Kontrola achievement milníků
  const achievements = [
    { count: 1, id: 'first_friend' },
    { count: 5, id: 'friendly' },
    { count: 10, id: 'social_butterfly' },
    { count: 25, id: 'popular' },
    { count: 50, id: 'superstar' }
  ];
  
  for (const { count, id } of achievements) {
    if (friendCount === count) {
      await prisma.achievementAward.create({
        data: {
          userId: session.user.id,
          achievementId: id,
          awardedAt: new Date()
        }
      });
    }
  }
  
  // ... zbytek kódu ...
}
```

## 5. Leaderboard

### Filtrování leaderboardu podle přátel

```typescript
// app/api/leaderboard/route.ts
export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const filterType = searchParams.get('filter'); // 'all', 'friends', 'class'
  
  let userIds: string[] | undefined;
  
  if (filterType === 'friends') {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId1: session.user.id },
          { userId2: session.user.id }
        ]
      }
    });
    
    userIds = friendships.map(f => 
      f.userId1 === session.user.id ? f.userId2 : f.userId1
    );
    userIds.push(session.user.id); // Přidáme i sebe
  }
  
  const leaderboard = await prisma.$queryRaw`
    SELECT * FROM "LeaderboardView"
    ${userIds ? Prisma.sql`WHERE id = ANY(${userIds})` : Prisma.empty}
    ORDER BY total_xp DESC
    LIMIT 100
  `;
  
  return NextResponse.json({ leaderboard });
}
```

### Zobrazení pozice přátel na leaderboardu

```typescript
// app/components/leaderboard/friends-positions.tsx
export async function FriendsPositions() {
  const friends = await getFriends();
  const leaderboard = await fetch('/api/leaderboard').then(r => r.json());
  
  const friendsWithPosition = friends.map(friend => {
    const position = leaderboard.findIndex(entry => entry.id === friend.id) + 1;
    return { ...friend, position };
  }).sort((a, b) => a.position - b.position);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pozice přátel na žebříčku</CardTitle>
      </CardHeader>
      <CardContent>
        {friendsWithPosition.map(friend => (
          <div key={friend.id} className="flex justify-between">
            <span>{friend.name}</span>
            <Badge>#{friend.position}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

## 6. Personal Space

### Navštívit personal space přítele

```typescript
// app/dashboard/friends/page.tsx
export function FriendCard({ friend }) {
  return (
    <Card>
      {/* ... základní info ... */}
      <Button asChild>
        <Link href={`/dashboard/personal-space/${friend.id}`}>
          Navštívit personal space
        </Link>
      </Button>
    </Card>
  );
}
```

### Omezení přístupu na pouze přátele

```typescript
// app/dashboard/personal-space/[userId]/page.tsx
export default async function PersonalSpacePage({ params }) {
  const session = await auth();
  const targetUserId = params.userId;
  
  // Zkontrolujeme, zda je cílový uživatel přítel
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId1: session.user.id, userId2: targetUserId },
        { userId1: targetUserId, userId2: session.user.id }
      ]
    }
  });
  
  if (!friendship && targetUserId !== session.user.id) {
    return <div>Můžete navštívit pouze personal space přátel</div>;
  }
  
  // ... zobrazení personal space ...
}
```

## 7. Quests System

### Kooperativní questy s přáteli

```typescript
// app/actions/quests.ts
export async function startCoopQuest(questId: string, friendIds: string[]) {
  const session = await auth();
  
  // Ověříme, že všichni jsou přátelé
  for (const friendId of friendIds) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: session.user.id, userId2: friendId },
          { userId1: friendId, userId2: session.user.id }
        ]
      }
    });
    
    if (!friendship) {
      throw new Error(`${friendId} není váš přítel`);
    }
  }
  
  // Vytvoříme quest progress pro všechny
  const questProgresses = await prisma.questProgress.createMany({
    data: [session.user.id, ...friendIds].map(userId => ({
      userId,
      questId,
      status: 'IN_PROGRESS',
      teamId: crypto.randomUUID() // Společný team ID
    }))
  });
  
  return questProgresses;
}
```

## 8. Notifications System

### Agregované notifikace od přátel

```typescript
// app/components/notifications/notifications-list.tsx
export function NotificationsList() {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    async function load() {
      const result = await fetch('/api/notifications').then(r => r.json());
      
      // Seskupíme notifikace od přátel
      const grouped = result.notifications.reduce((acc, notif) => {
        if (notif.type.startsWith('FRIEND_')) {
          if (!acc.friends) acc.friends = [];
          acc.friends.push(notif);
        } else {
          if (!acc.other) acc.other = [];
          acc.other.push(notif);
        }
        return acc;
      }, {});
      
      setNotifications(grouped);
    }
    load();
  }, []);
  
  return (
    <div>
      {notifications.friends?.length > 0 && (
        <div>
          <h3>Přátelé ({notifications.friends.length})</h3>
          {notifications.friends.map(notif => (
            <NotificationCard key={notif.id} notification={notif} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## 9. Real Rewards System

### Sdílení real rewards s přáteli

```typescript
// app/components/real-rewards/share-achievement.tsx
export function ShareAchievement({ rewardId }) {
  const [friends, setFriends] = useState([]);
  
  async function shareWithFriends(selectedFriendIds: string[]) {
    await prisma.notification.createMany({
      data: selectedFriendIds.map(friendId => ({
        userId: friendId,
        type: 'FRIEND_REAL_REWARD',
        title: 'Přítel získal real reward!',
        message: `${session.user.name} získal real reward!`,
        data: JSON.stringify({ rewardId })
      }))
    });
    
    toast.success('Sdíleno s přáteli!');
  }
  
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sdílet s přáteli</DialogTitle>
        </DialogHeader>
        {/* Výběr přátel */}
        <Button onClick={() => shareWithFriends(selectedIds)}>
          Sdílet
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

## 🎯 Summary

Systém přátel je plně integrován s:
- ✅ Guilds - Doporučování a společné guildy
- ✅ Trading - Trust bonus a filtrování
- ✅ Events - Team building a notifikace
- ✅ Achievements - Sociální achievementy
- ✅ Leaderboards - Srovnání s přáteli
- ✅ Personal Space - Návštěvy přátel
- ✅ Quests - Kooperativní questy
- ✅ Notifications - Agregované notifikace
- ✅ Real Rewards - Sdílení úspěchů

Všechny integrace respektují bezpečnost a privacy nastavení!
