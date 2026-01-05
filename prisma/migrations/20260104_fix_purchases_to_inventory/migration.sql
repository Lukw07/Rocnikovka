-- Migrace: Synchronizace koupených věcí do UserInventory
-- Vytvářím UserInventory záznamy ze všech Purchase záznamů
-- Tím se opraví problém, kdy koupeně věci nebyly viditelné v inventáři

INSERT INTO "UserInventory" (id, "userId", "itemId", quantity, "isEquipped", "obtainedAt")
SELECT 
  gen_random_uuid(),
  p."userId",
  p."itemId",
  COUNT(*) as quantity,
  false as "isEquipped",
  MIN(p."createdAt") as "obtainedAt"
FROM "Purchase" p
GROUP BY p."userId", p."itemId"
ON CONFLICT ("userId", "itemId") DO UPDATE
SET quantity = "UserInventory".quantity + EXCLUDED.quantity;
