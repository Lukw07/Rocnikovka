CREATE OR REPLACE VIEW "LeaderboardView" AS
SELECT
  u.id,
  u.name,
  u."classId",
  u.grade,
  u.role,
  c.name as class_name,
  COALESCE(SUM(x.amount), 0)::integer as total_xp
FROM "User" u
LEFT JOIN "Class" c ON u."classId" = c.id
LEFT JOIN "XPAudit" x ON u.id = x."userId"
GROUP BY u.id, u.name, u."classId", u.grade, u.role, c.name;
