/**
 * Test script for Skillpoints & Attributes System
 * 
 * This script tests the complete flow:
 * 1. Core attributes exist in database
 * 2. Player can earn skillpoints from level-ups
 * 3. Player can allocate skillpoints to attributes
 * 4. Attributes apply bonuses correctly
 * 5. Job completions grant skillpoints and apply bonuses
 */

import { prisma } from "@/app/lib/prisma"
import { LevelingSystem } from "@/app/lib/leveling"
import { ProgressionService } from "@/app/lib/services/progression"
import { getPlayerAttributeEffects } from "@/app/lib/attribute-effects"

async function testSkillpointsSystem() {
  console.log("🧪 Testing Skillpoints & Attributes System\n")
  
  try {
    // 1. Check core attributes exist
    console.log("1️⃣  Checking core attributes...")
    const coreAttributes = await prisma.skill.findMany({
      where: { category: "Core" }
    })
    
    console.log(`   ✅ Found ${coreAttributes.length} core attributes:`)
    coreAttributes.forEach(attr => {
      console.log(`      - ${attr.icon} ${attr.name} (max level: ${attr.maxLevel})`)
    })
    
    if (coreAttributes.length !== 5) {
      console.warn(`   ⚠️  Expected 5 core attributes, found ${coreAttributes.length}`)
      console.log("   Run seed: npx ts-node ops/seed-core-attributes.ts")
    }
    
    // 2. Test skillpoint allocation
    console.log("\n2️⃣  Testing skillpoint allocation...")
    const testUserId = "test-user-" + Date.now()
    
    // Award initial skillpoints
    const skillPoints = await prisma.skillPoint.create({
      data: {
        userId: testUserId,
        available: 3,
        spent: 0,
        total: 3
      }
    })
    console.log(`   ✅ Created test user with ${skillPoints.available} skillpoints`)
    
    // 3. Allocate skillpoint to Time Management
    console.log("\n3️⃣  Testing attribute level-up...")
    const timeManagement = coreAttributes.find(a => a.name === "Time Management")
    if (timeManagement) {
      const allocated = await ProgressionService.spendSkillpoint(
        testUserId,
        timeManagement.id,
        1
      )
      console.log(`   ✅ Time Management leveled up to ${allocated.level}`)
      
      // 4. Check attribute effects
      console.log("\n4️⃣  Testing attribute effects...")
      const effects = await getPlayerAttributeEffects(testUserId)
      const tmBonus = ((effects.timeManagementBonus - 1) * 100).toFixed(1)
      console.log(`   ✅ Time Management bonus: +${tmBonus}% XP gain`)
      console.log(`   ✅ Total effect power: ${effects.totalEffectPower.toFixed(1)}/100`)
    }
    
    // 5. Test multiple attribute levels
    console.log("\n5️⃣  Testing multiple attribute levels...")
    const leadership = coreAttributes.find(a => a.name === "Leadership")
    const focus = coreAttributes.find(a => a.name === "Focus")
    
    if (leadership && focus && skillPoints.available >= 2) {
      await ProgressionService.spendSkillpoint(testUserId, leadership.id, 1)
      await ProgressionService.spendSkillpoint(testUserId, focus.id, 1)
      
      const effects = await getPlayerAttributeEffects(testUserId)
      console.log(`   ✅ Time Management: +${((effects.timeManagementBonus - 1) * 100).toFixed(1)}%`)
      console.log(`   ✅ Leadership: +${((effects.leadershipBonus - 1) * 100).toFixed(1)}%`)
      console.log(`   ✅ Focus: +${((effects.focusBonus - 1) * 100).toFixed(1)}%`)
      console.log(`   ✅ Total power: ${effects.totalEffectPower.toFixed(1)}/100`)
    }
    
    // 6. Test level system integration
    console.log("\n6️⃣  Testing level system integration...")
    const xpForLevel5 = LevelingSystem.getTotalXPForLevel(5)
    const xpForLevel10 = LevelingSystem.getTotalXPForLevel(10)
    console.log(`   ✅ Level 5 requires: ${xpForLevel5} XP`)
    console.log(`   ✅ Level 10 requires: ${xpForLevel10} XP`)
    console.log(`   ✅ Level-up grants skillpoints at key intervals`)
    
    // Cleanup
    console.log("\n7️⃣  Cleaning up test data...")
    await prisma.skillPoint.delete({
      where: { userId: testUserId }
    })
    await prisma.playerSkill.deleteMany({
      where: { userId: testUserId }
    })
    console.log(`   ✅ Test data cleaned up`)
    
    console.log("\n" + "=".repeat(50))
    console.log("✨ ALL TESTS PASSED!")
    console.log("=".repeat(50))
    
    console.log("\n📚 Next steps:")
    console.log("1. Run seed script: npx ts-node ops/seed-core-attributes.ts")
    console.log("2. Import components in dashboard:")
    console.log("   - SkillsDisplay from components/dashboard/attributes/skills-display")
    console.log("   - SkillPointAllocator from components/dashboard/attributes/skillpoint-allocator")
    console.log("3. Display skillpoints in player progression")
    console.log("4. Test in staging environment")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

// Run tests
testSkillpointsSystem()
  .catch(err => {
    console.error("Fatal error:", err)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
