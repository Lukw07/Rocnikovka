-- Migrace: Vytvoření UserInventory záznamů ze stávajících Purchase záznamů
-- Tato migrace zajistí, že všechny koupeně věci budou viditelné v inventáři

INSERT INTO "UserInventory" ("id", "userId", "itemId", "quantity", "isEquipped", "obtainedAt", "usedAt", "expiresAt")
SELECT 
  gen_random_uuid()::text,
  "userId",
  "itemId", 
  COUNT(*) as quantity,  -- Počet nákupů stejné věci = quantity
  false,                  -- Defaultně neequipované
  MIN("createdAt"),       -- Datum prvního nákupu
  NULL,
  NULL
FROM "Purchase"
GROUP BY "userId", "itemId"
ON CONFLICT ("userId", "itemId") DO UPDATE
SET "quantity" = EXCLUDED."quantity" + "UserInventory"."quantity"
WHERE "UserInventory"."quantity" < EXCLUDED."quantity";
