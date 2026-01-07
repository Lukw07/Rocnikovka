# Friends System - Systém přátel

## 📋 Přehled

Systém přátel umožňuje hráčům navazovat přátelské vztahy, komunikovat a spolupracovat v rámci gamifikačního prostředí EduRPG. Systém je plně integrovaný s ostatními mechanikami jako jsou guildy, trading, eventy a další.

## 🎯 Hlavní funkce

### ✅ Implementované funkce

1. **Vyhledávání hráčů**
   - Vyhledávání podle jména nebo emailu
   - Zobrazení základních informací (XP, role, ročník)
   - Filtrování výsledků podle vztahu

2. **Friend Requests (Žádosti o přátelství)**
   - Posílání žádostí s volitelnou zprávou
   - Přijímání/odmítání žádostí
   - Automatické přijetí při oboustranné žádosti
   - Zrušení odeslaných žádostí

3. **Správa přátel**
   - Seznam všech přátel
   - Zobrazení detailů přátel (XP, ročník, datum přátelství)
   - Odebrání přítele (unfriend)

4. **Notifikace**
   - Notifikace při nové žádosti
   - Notifikace při přijetí žádosti
   - Integrace se systémem notifikací

## 🗄️ Databázové schéma

### Model: Friendship
```prisma
model Friendship {
  id          String   @id @default(cuid())
  userId1     String   // Uživatel s nižším ID
  userId2     String   // Uživatel s vyšším ID
  createdAt   DateTime @default(now())
  
  user1       User     @relation("FriendshipInitiator")
  user2       User     @relation("FriendshipReceiver")
}
```

### Model: FriendRequest
```prisma
model FriendRequest {
  id          String              @id @default(cuid())
  senderId    String
  receiverId  String
  status      FriendRequestStatus @default(PENDING)
  message     String?
  createdAt   DateTime            @default(now())
  respondedAt DateTime?
  
  sender      User                @relation("FriendRequestSender")
  receiver    User                @relation("FriendRequestReceiver")
}

enum FriendRequestStatus {
  PENDING
  ACCEPTED
  DECLINED
  CANCELLED
}
```

## 🔌 API Endpointy

### GET /api/friends
Vrací seznam přátel aktuálního uživatele.

**Response:**
```json
{
  "friends": [
    {
      "id": "user_id",
      "name": "Jméno Příjmení",
      "email": "email@example.com",
      "avatarUrl": "url",
      "role": "STUDENT",
      "grade": 3,
      "totalXP": 1500,
      "friendshipId": "friendship_id",
      "friendSince": "2025-01-02T10:00:00.000Z"
    }
  ],
  "count": 10
}
```

### GET /api/friends/requests
Vrací friend requests (odeslané/přijaté).

**Query params:**
- `type`: `sent` | `received` | `all` (default: `all`)

### POST /api/friends/requests
Vytvoří nový friend request.

**Body:**
```json
{
  "receiverId": "user_id",
  "message": "Volitelná zpráva"
}
```

### PATCH /api/friends/requests/[id]
Přijme nebo odmítne friend request.

**Body:**
```json
{
  "action": "accept" | "decline"
}
```

### DELETE /api/friends/requests/[id]
Zruší odeslaný friend request.

### DELETE /api/friends/[id]
Odstraní přátelství (unfriend).

### GET /api/friends/search
Vyhledá uživatele podle jména nebo emailu.

**Query params:**
- `q`: vyhledávací dotaz (min. 2 znaky)
- `limit`: max počet výsledků (default: 20)

## 🎨 Frontend komponenty

### Stránka: /dashboard/friends
Hlavní stránka pro správu přátel s třemi záložkami:

1. **Moji přátelé** - Seznam všech přátel
2. **Žádosti** - Přijaté a odeslané friend requests
3. **Hledat** - Vyhledávání nových přátel

### Komponenty

#### FriendsList
- Zobrazení seznamu přátel v kartách
- Informace o XP a datu přátelství
- Tlačítko pro odebrání přítele s potvrzením

#### FriendRequests
- Dvě záložky: Přijaté a Odeslané
- Přijímání/odmítání přijatých žádostí
- Zrušení odeslaných žádostí
- Zobrazení volitelné zprávy

#### SearchUsers
- Vyhledávání s live aktualizací
- Zobrazení statusu vztahu s každým uživatelem
- Tlačítka dle statusu:
  - NONE: "Poslat žádost"
  - REQUEST_SENT: "Žádost odeslána" (možnost zrušit)
  - REQUEST_RECEIVED: "Přijmout žádost"
  - FRIENDS: "Přátelé"
- Dialog pro přidání volitelné zprávy

## 🔄 Server Actions

Všechny server actions jsou v souboru `app/actions/friends.ts`:

- `getFriends()` - Načte seznam přátel
- `getFriendRequests(type)` - Načte friend requests
- `sendFriendRequest(receiverId, message)` - Pošle žádost
- `acceptFriendRequest(requestId)` - Přijme žádost
- `declineFriendRequest(requestId)` - Odmítne žádost
- `cancelFriendRequest(requestId)` - Zruší žádost
- `removeFriend(friendshipId)` - Odebere přítele
- `searchUsers(query, limit)` - Vyhledá uživatele

## 🔗 Integrace s ostatními systémy

### Guildy
- Přátelé mohou spolu zakládat guildy
- Doporučování přátel při vytváření guildy
- Notifikace o guildových aktivitách přátel

### Trading System
- Preferenční obchody s přáteli
- Možnost obchodovat pouze s přáteli (nastavení)
- História obchodů s přáteli

### Events
- Možnost pozvat přátele do event teamů
- Společné účasti na eventech
- Notifikace o eventových aktivitách přátel

### Personal Space
- Možnost navštívit personal space přítele
- Sdílení achievementů a awards

### Achievements & Streaks
- Speciální achievementy za přátele (např. "Mít 10 přátel")
- Srovnání streaks s přáteli
- Společné achievementy

### Leaderboards
- Filtrování leaderboardu podle přátel
- Srovnání s přáteli

## 🛡️ Bezpečnost

1. **Autorizace**: Všechny endpointy vyžadují autentizaci
2. **Validace**: Kontrola oprávnění u každé akce
3. **Rate limiting**: Prevence spamování žádostí
4. **Privacy**: Uživatelé si mohou nastavit viditelnost

## 🔐 Oprávnění

### Student
- ✅ Může vyhledávat všechny uživatele
- ✅ Může posílat/přijímat friend requests
- ✅ Může spravovat své přátele

### Teacher
- ✅ Stejná oprávnění jako Student
- ✅ Může vidět přátelské vztahy mezi studenty (admin panel)

### Admin
- ✅ Plná kontrola nad systémem přátel
- ✅ Může mazat nevhodné vztahy

## 📊 Statistiky a metriky

Systém sleduje:
- Počet přátel na uživatele
- Počet odeslaných/přijatých žádostí
- Průměrný čas na přijetí žádosti
- Aktivní přátelství (interakce v posledních 30 dnech)

## 🎯 Budoucí vylepšení

1. **Friend Groups** - Organizace přátel do skupin
2. **Best Friend System** - Označení nejlepších přátel
3. **Mutual Friends** - Zobrazení společných přátel
4. **Friend Activity Feed** - Timeline aktivit přátel
5. **Private Messaging** - Přímé zprávy mezi přáteli
6. **Friend Recommendations** - AI doporučování přátel

## 🚀 Nasazení

### 1. Migrace databáze
```bash
npx prisma migrate dev --name add_friends_system
npx prisma generate
```

### 2. Restart aplikace
```bash
npm run dev
```

### 3. Testování
- Přihlaste se jako student
- Otevřete `/dashboard/friends`
- Vyhledejte jiného studenta
- Pošlete friend request
- Přihlaste se jako druhý student a přijměte

## 📝 Poznámky

- Systém je navržen pro férové chování - nelze spamovat žádosti
- Friendship je uloženo pouze jednou (normalizace: userId1 < userId2)
- Automatické přijetí při oboustranné žádosti zvyšuje UX
- Všechny akce jsou auditovány v notifikacích
- Kompatibilní s existujícím systémem notifikací

## 🎨 UI/UX Doporučení

- Zobrazovat počet pending requests v navigaci
- Badge notifikace u nových žádostí
- Animace při přijetí přítele
- Toast notifikace pro všechny akce
- Potvrzovací dialogy pro kritické akce (unfriend)

## 🔍 Troubleshooting

### Problém: Nelze poslat friend request
- Zkontrolujte, zda příjemce existuje
- Ověřte, že nejste již přátelé
- Zkontrolujte, zda již neexistuje pending request

### Problém: Přátelé se nezobrazují
- Zkontrolujte databázové připojení
- Ověřte, že migrace proběhla úspěšně
- Zkontrolujte konzoli prohlížeče pro chyby

### Problém: Notifikace nepřicházejí
- Ověřte, že notification systém funguje
- Zkontrolujte nastavení notifikací uživatele
