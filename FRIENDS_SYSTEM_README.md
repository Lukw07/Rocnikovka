# Friends System - README

## 🎯 O systému

Systém přátel umožňuje studentům a učitelům v EduRPG platformě navazovat přátelské vztahy, spolupracovat a sdílet své úspěchy. Je plně integrován s ostatními gamifikačními mechanikami jako jsou guildy, trading, eventy, achievementy a další.

## ✨ Hlavní funkce

- 🔍 **Vyhledávání uživatelů** - Najděte své spolužáky podle jména nebo emailu
- 📨 **Friend Requests** - Posílejte žádosti o přátelství s volitelnou zprávou
- 🤝 **Správa přátel** - Zobrazení všech přátel s jejich statistikami
- 🔔 **Notifikace** - Automatické upozornění na nové žádosti a jejich přijetí
- 🔗 **Integrace** - Využití přátelství v guildách, tradingu, eventech a dalších systémech

## 🚀 Instalace a nasazení

### Krok 1: Migrace databáze

```bash
# Vygenerování migrace
npx prisma migrate dev --name add_friends_system

# Vygenerování Prisma klienta
npx prisma generate
```

### Krok 2: Seed testovacích dat (volitelné)

```bash
# Seed přátelství a friend requests
npx tsx ops/seed-friends.ts
```

### Krok 3: Restart aplikace

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📂 Struktura souborů

```
EduRPG/
├── prisma/
│   └── schema.prisma                    # Databázové modely (Friendship, FriendRequest)
├── app/
│   ├── api/
│   │   └── friends/
│   │       ├── route.ts                 # GET seznam přátel
│   │       ├── search/
│   │       │   └── route.ts             # GET vyhledávání uživatelů
│   │       ├── requests/
│   │       │   ├── route.ts             # GET/POST friend requests
│   │       │   └── [id]/
│   │       │       └── route.ts         # PATCH přijmout/odmítnout, DELETE zrušit
│   │       └── [id]/
│   │           └── route.ts             # DELETE unfriend
│   ├── actions/
│   │   └── friends.ts                   # Server actions pro friends
│   ├── dashboard/
│   │   └── friends/
│   │       └── page.tsx                 # Hlavní stránka Friends
│   └── components/
│       └── friends/
│           ├── friends-list.tsx         # Seznam přátel
│           ├── friend-requests.tsx      # Správa žádostí
│           └── search-users.tsx         # Vyhledávání uživatelů
├── ops/
│   └── seed-friends.ts                  # Seed testovacích dat
└── docs/
    ├── FRIENDS_SYSTEM_DOCUMENTATION.md          # Kompletní dokumentace
    ├── FRIENDS_SYSTEM_QUICK_REFERENCE.md        # Rychlá reference
    ├── FRIENDS_SYSTEM_INTEGRATION_EXAMPLES.md   # Příklady integrace
    └── FRIENDS_SYSTEM_IMPLEMENTATION_SUMMARY.md # Implementační souhrn
```

## 🎮 Jak používat

### Pro studenty

1. **Přihlaste se** do EduRPG
2. **Přejděte na** `/dashboard/friends`
3. **Klikněte na záložku "Hledat"**
4. **Zadejte jméno** nebo email spolužáka
5. **Klikněte "Poslat žádost"**
6. **Zkontrolujte záložku "Žádosti"** pro nové přijaté žádosti

### Pro učitele

Učitelé mají stejné funkce jako studenti plus:
- Možnost vidět statistiky přátelství mezi studenty
- Admin panel s přehledem vztahů

## 🔌 API Reference

### GET /api/friends
Vrací seznam přátel aktuálního uživatele.

```typescript
// Response
{
  friends: Friend[],
  count: number
}
```

### GET /api/friends/requests
Vrací friend requests.

```typescript
// Query params
?type=sent|received|all

// Response
{
  requests: FriendRequest[],
  count: number
}
```

### POST /api/friends/requests
Vytvoří nový friend request.

```typescript
// Body
{
  receiverId: string,
  message?: string
}

// Response
{
  request: FriendRequest,
  message: string
}
```

### PATCH /api/friends/requests/[id]
Přijme nebo odmítne friend request.

```typescript
// Body
{
  action: 'accept' | 'decline'
}

// Response
{
  message: string,
  friendship?: Friendship
}
```

### DELETE /api/friends/requests/[id]
Zruší odeslaný friend request.

### DELETE /api/friends/[id]
Odstraní přátelství (unfriend).

### GET /api/friends/search
Vyhledá uživatele.

```typescript
// Query params
?q=search_query&limit=20

// Response
{
  users: SearchedUser[],
  count: number,
  query: string
}
```

## 🔧 Server Actions

```typescript
// Načtení přátel
const { friends } = await getFriends();

// Vyhledání uživatelů
const { users } = await searchUsers("Jan Novák");

// Poslání žádosti
const result = await sendFriendRequest(userId, "Ahoj!");

// Přijetí žádosti
const result = await acceptFriendRequest(requestId);

// Odmítnutí žádosti
const result = await declineFriendRequest(requestId);

// Zrušení žádosti
const result = await cancelFriendRequest(requestId);

// Odebrání přítele
const result = await removeFriend(friendshipId);
```

## 🔗 Integrace s ostatními systémy

### Guildy
```typescript
// Doporučit přátele při vytváření guildy
const { friends } = await getFriends();
```

### Trading
```typescript
// Filtrovat obchody od přátel
const trades = await getTrades({ friendsOnly: true });
```

### Events
```typescript
// Pozvat přátele do eventu
const friends = await getFriends();
```

### Achievements
```typescript
// Sociální achievementy se automaticky odemykají
// při dosažení určitého počtu přátel
```

## 🛡️ Bezpečnost

- ✅ Všechny endpointy vyžadují autentizaci
- ✅ Validace oprávnění u každé akce
- ✅ Ochrana proti spamování
- ✅ SQL injection prevence
- ✅ XSS protection

## 🐛 Troubleshooting

### Problém: "Unauthorized"
**Řešení:** Přihlaste se do aplikace. Všechny endpointy vyžadují aktivní session.

### Problém: "Already friends"
**Řešení:** S tímto uživatelem již jste přátelé. Zkontrolujte záložku "Moji přátelé".

### Problém: "Friend request already exists"
**Řešení:** Již existuje pending žádost. Zkontrolujte záložku "Žádosti".

### Problém: Přátelé se nezobrazují
**Řešení:** 
1. Zkontrolujte konzoli prohlížeče pro chyby
2. Ověřte, že migrace proběhla úspěšně
3. Zkontrolujte databázové připojení

### Problém: Notifikace nepřicházejí
**Řešení:**
1. Ověřte, že notification systém funguje
2. Zkontrolujte nastavení notifikací v profilu

## 📊 Monitoring a metriky

Systém sleduje:
- Počet přátel na uživatele
- Počet odeslaných žádostí
- Acceptance rate žádostí
- Průměrný čas na přijetí
- Aktivní přátelství

## 🎯 Best Practices

### Pro vývojáře
1. Vždy validujte na backendu
2. Používejte server actions pro konzistenci
3. Cachujte seznam přátel
4. Optimalizujte dotazy s indexy

### Pro uživatele
1. Buďte zdvořilí v žádostech
2. Přidávejte zprávu k žádosti
3. Odpovídejte na žádosti včas
4. Komunikujte s přáteli

## 📚 Další dokumentace

- [Kompletní dokumentace](FRIENDS_SYSTEM_DOCUMENTATION.md)
- [Quick Reference](FRIENDS_SYSTEM_QUICK_REFERENCE.md)
- [Integration Examples](FRIENDS_SYSTEM_INTEGRATION_EXAMPLES.md)
- [Implementation Summary](FRIENDS_SYSTEM_IMPLEMENTATION_SUMMARY.md)

## 🆘 Podpora

Máte problém nebo otázku?
1. Zkontrolujte dokumentaci
2. Prohledejte Known Issues
3. Kontaktujte vývojový tým

## 📝 Changelog

### Version 1.0.0 (2026-01-02)
- ✅初版发布 Complete Friends System
- ✅ Vyhledávání uživatelů
- ✅ Friend requests s automatickým přijetím
- ✅ Správa přátel
- ✅ Notifikace
- ✅ Integrace s ostatními systémy
- ✅ Kompletní dokumentace

## 📄 Licence

MIT License - Copyright (c) 2026 EduRPG

---

**Vytvořeno s ❤️ pro EduRPG Community**
