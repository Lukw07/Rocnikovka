# ⚡ SKILLPOINTS SYSTEM - QUICK REFERENCE

## 🎯 Core Attributes At a Glance

| Attribute | Icon | Effect | Max Bonus |
|-----------|------|--------|-----------|
| **Time Management** | ⏰ | +2% XP per level | +20% XP |
| **Focus** | 🎯 | +3% skill speed per level | +30% speed |
| **Leadership** | 👑 | +2% job rewards per level | +20% rewards |
| **Communication** | 💬 | +3% reputation per level | +30% rep |
| **Consistency** | 🔄 | +1.5% streak bonus per level | +15% streaks |

---

## 🚀 Quick Start

```bash
# Initialize attributes in database
npx ts-node ops/seed-core-attributes.ts

# Test the system
npx ts-node ops/test-skillpoints.ts

# Import and use in components
import { SkillsDisplay } from "@/app/components/dashboard/attributes/skills-display"
import { SkillPointAllocator } from "@/app/components/dashboard/attributes/skillpoint-allocator"
```

---

## 📡 API Quick Reference

### Get All Attributes
```bash
GET /api/progression/attributes

Response:
{
  "attributes": [...],
  "total": 5
}
```

### Get Player's Attributes
```bash
GET /api/progression/attributes/player

Response:
{
  "attributes": [...],
  "effects": {
    "timeManagementBonus": 1.10,  // +10%
    "focusBonus": 1.05,
    "leadershipBonus": 1.08,
    "communicationBonus": 1.12,
    "consistencyBonus": 1.06,
    "totalEffectPower": 45.2
  },
  "totalPower": 45.2
}
```

### Spend Skillpoint
```bash
POST /api/progression/skillpoints/spend
{
  "skillId": "skill-id",
  "points": 1
}
```

---

## 🔧 Key Files to Know

| File | Purpose |
|------|---------|
| `app/lib/attribute-effects.ts` | Bonus calculations |
| `app/lib/services/xp.ts` | Time Mgmt bonus integration |
| `app/lib/services/jobs.ts` | Leadership + skillpoint grant |
| `app/lib/services/progression.ts` | Skillpoint tracking |
| `components/dashboard/attributes/*` | Frontend components |

---

## 💡 Common Tasks

### Add Time Management Bonus to XP
Already implemented in `XPService.grantXPWithBonus()`

### Add Leadership Bonus to Jobs
Already implemented in `JobsService.completeJob()`

### Change Attribute Effects
Edit `CORE_ATTRIBUTES` in `app/lib/attribute-effects.ts`:
```typescript
TIME_MANAGEMENT: {
  baseEffectValue: 0.02,  // Change this
  maxBonus: 0.20         // Or this
}
```

### Display Attributes in UI
```tsx
import { SkillsDisplay } from "@/app/components/dashboard/attributes/skills-display"

<SkillsDisplay userId={userId} />
```

### Show Skillpoint Allocation UI
```tsx
import { SkillPointAllocator } from "@/app/components/dashboard/attributes/skillpoint-allocator"

<SkillPointAllocator onSkillPurchased={(skillId, name, level) => {
  console.log(`${name} → Level ${level}`)
}} />
```

---

## 🎮 Gameplay Flow

```
Activity → Earn XP (+ Time Mgmt bonus)
        → Complete Job (+ Leadership bonus + 1 skillpoint)
        → Level Up (+ 1-5 skillpoints)
           ↓
        Allocate Skillpoints
           ↓
        Increase Attribute Level
           ↓
        Get System Bonuses
```

---

## 🐛 Debugging

### Check attributes in database
```sql
SELECT * FROM Skill WHERE category = 'Core';
SELECT * FROM PlayerSkill WHERE userId = 'user-id';
SELECT * FROM SkillPoint WHERE userId = 'user-id';
```

### Test bonus calculation
```typescript
import { getPlayerAttributeEffects } from "@/app/lib/attribute-effects"

const effects = await getPlayerAttributeEffects(userId)
console.log(effects)
```

### Run test script
```bash
npx ts-node ops/test-skillpoints.ts
```

---

## 📚 Documentation Links

| Doc | Purpose |
|-----|---------|
| SKILLPOINTS_SYSTEM.md | Full technical specs |
| SKILLPOINTS_INTEGRATION_GUIDE.md | How to integrate |
| SKILLPOINTS_IMPLEMENTATION_SUMMARY.md | Architecture overview |
| SKILLPOINTS_COMPLETION_REPORT.md | Delivery summary |

---

## ✅ Deployment Checklist

- [ ] Seed script run: `npx ts-node ops/seed-core-attributes.ts`
- [ ] Test passed: `npx ts-node ops/test-skillpoints.ts`
- [ ] APIs tested in Postman/curl
- [ ] Components added to dashboard
- [ ] Styled appropriately for theme
- [ ] Tested in staging environment
- [ ] Monitored for errors in production

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Attributes not found" | Run seed script |
| "API 404" | Check routes exist |
| "No data in UI" | Check API response in devtools |
| "Bonus not applying" | Verify attribute level exists |
| "Skillpoints don't spend" | Check available balance |

---

## 🎯 Performance Notes

- Attribute calculations happen server-side (secure)
- No N+1 queries in attribute fetching
- Bonuses cached in service calls
- Frontend uses React hooks for efficiency

---

**Last Updated:** January 2, 2026
**System Status:** ✅ Production Ready
