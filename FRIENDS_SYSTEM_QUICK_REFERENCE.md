# Friends System - Quick Reference

## 🚀 Rychlý start

### Pro studenty
1. Jděte na `/dashboard/friends`
2. Klikněte na záložku "Hledat"
3. Zadejte jméno nebo email spolužáka
4. Klikněte "Poslat žádost"
5. Zkontrolujte záložku "Žádosti" pro nové přijaté žádosti

### Pro učitele
- Stejné funkce jako studenti
- Možnost vidět statistiky přátelství v admin panelu

## 📋 Klíčové API endpointy

| Endpoint | Method | Popis |
|----------|--------|-------|
| `/api/friends` | GET | Seznam přátel |
| `/api/friends/requests` | GET | Friend requests |
| `/api/friends/requests` | POST | Poslat žádost |
| `/api/friends/requests/[id]` | PATCH | Přijmout/Odmítnout |
| `/api/friends/requests/[id]` | DELETE | Zrušit žádost |
| `/api/friends/[id]` | DELETE | Unfriend |
| `/api/friends/search` | GET | Vyhledat uživatele |

## 🔧 Server Actions

```typescript
// Načtení přátel
const { friends } = await getFriends();

// Vyhledání uživatelů
const { users } = await searchUsers("Jan");

// Poslání žádosti
await sendFriendRequest(userId, "Ahoj!");

// Přijetí žádosti
await acceptFriendRequest(requestId);

// Odmítnutí žádosti
await declineFriendRequest(requestId);

// Zrušení žádosti
await cancelFriendRequest(requestId);

// Odebrání přítele
await removeFriend(friendshipId);
```

## 🗄️ Databázové modely

### Friendship
```prisma
{
  id: string
  userId1: string    // Nižší ID
  userId2: string    // Vyšší ID
  createdAt: DateTime
}
```

### FriendRequest
```prisma
{
  id: string
  senderId: string
  receiverId: string
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED"
  message: string?
  createdAt: DateTime
  respondedAt: DateTime?
}
```

## 🎨 Frontend komponenty

### Použití
```tsx
import { FriendsList } from "@/app/components/friends/friends-list";
import { FriendRequests } from "@/app/components/friends/friend-requests";
import { SearchUsers } from "@/app/components/friends/search-users";

// V komponentě
<FriendsList />
<FriendRequests />
<SearchUsers />
```

## 🔗 Integrace s ostatními systémy

### Guildy
```typescript
// Doporučit přátele při vytváření guildy
const friends = await getFriends();
const friendIds = friends.map(f => f.id);
```

### Trading
```typescript
// Filtrovat obchody od přátel
const friendsOnly = await getTrades({ friendsOnly: true });
```

### Events
```typescript
// Pozvat přátele do eventu
const friends = await getFriends();
// Zobraz seznam přátel k pozvání
```

## ⚡ Běžné use cases

### Automatické přijetí při oboustranné žádosti
```typescript
// Uživatel A pošle žádost uživateli B
// Uživatel B pošle žádost uživateli A
// → Systém automaticky vytvoří přátelství
```

### Zobrazení statusu vztahu
```typescript
const { users } = await searchUsers("Jan");
users.forEach(user => {
  switch(user.relationshipStatus) {
    case 'FRIENDS': // Již přátelé
    case 'REQUEST_SENT': // Čeká na odpověď
    case 'REQUEST_RECEIVED': // Čeká na vaši odpověď
    case 'NONE': // Žádný vztah
  }
});
```

## 🛡️ Validace a zabezpečení

### Backend validace
- ✅ Nelze poslat request sám sobě
- ✅ Nelze poslat duplikátní request
- ✅ Nelze poslat request existujícímu příteli
- ✅ Pouze příjemce může přijmout/odmítnout
- ✅ Pouze odesílatel může zrušit
- ✅ Pouze účastníci mohou unfriend

## 📊 Statistiky

```typescript
// Počet přátel
const { friends } = await getFriends();
const count = friends.length;

// Pending requests
const { requests } = await getFriendRequests('received');
const pendingCount = requests.length;
```

## 🎯 Achievementy související s přáteli

| Achievement | Podmínka |
|-------------|----------|
| Social Butterfly | Mít 10+ přátel |
| Popular | Mít 50+ přátel |
| Networker | Poslat 100+ žádostí |
| Friendly | Přijmout 50+ žádostí |

## 💡 Tips & Tricks

1. **Hromadné přidávání**: Vyhledejte třídu a pošlete žádosti více spolužákům
2. **Rychlé přijetí**: Oboustranné žádosti jsou automaticky přijaty
3. **Organizace**: Využijte personal space k zobrazení přátel
4. **Privacy**: V budoucnu bude možné nastavit viditelnost profilu

## 🔍 Debug

### Kontrola stavu přátelství
```sql
-- Najít všechny friendshipy uživatele
SELECT * FROM "Friendship" 
WHERE "userId1" = 'user_id' OR "userId2" = 'user_id';

-- Najít všechny pending requests
SELECT * FROM "FriendRequest" 
WHERE status = 'PENDING' 
AND ("senderId" = 'user_id' OR "receiverId" = 'user_id');
```

### Časté chyby
- **"Already friends"**: Friendship již existuje
- **"Friend request already exists"**: Pending request již existuje
- **"Unauthorized"**: Chybí session/autentizace
- **"Not found"**: Request/Friendship neexistuje

## 📱 Mobilní zobrazení

- Responzivní grid pro karty přátel
- Touch-friendly tlačítka
- Optimalizované pro malé obrazovky
- Swipe akce (budoucí feature)

## 🌐 Lokalizace

Systém používá české texty:
- "Přátelé" místo "Friends"
- "Žádosti" místo "Requests"
- "Hledat" místo "Search"

## ⚙️ Konfigurace

```typescript
// V .env souboru (budoucí)
FRIENDS_MAX_PER_USER=100
FRIENDS_REQUEST_LIMIT_PER_DAY=20
FRIENDS_SEARCH_LIMIT=20
```

## 🚨 Known Issues

- Žádné známé problémy v current verzi
- Všechny funkce byly testovány
- Plná integrace s existujícím systémem

## 📞 Support

Při problémech kontaktujte:
- Backend: Zkontrolujte logy serveru
- Frontend: Zkontrolujte browser console
- Database: Zkontrolujte Prisma Studio
