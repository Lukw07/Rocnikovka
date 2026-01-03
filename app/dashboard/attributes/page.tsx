"use client"

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { redirect } from "next/navigation"
import { SkillsDisplay } from "@/app/components/dashboard/attributes/skills-display"
import { SkillPointAllocator } from "@/app/components/dashboard/attributes/skillpoint-allocator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AttributesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto py-8">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-4xl font-bold mb-2">Core Attributes</h1>
      <p className="text-muted-foreground mb-8">
        Master these attributes to unlock powerful bonuses throughout the system
      </p>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attributes display (left/full width) */}
        <div className="lg:col-span-2">
          <SkillsDisplay userId={session.user.id} />
        </div>

        {/* Skillpoint allocator (right sidebar) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <SkillPointAllocator
              onSkillPurchased={(skillId, skillName, newLevel) => {
                console.log(`✨ ${skillName} leveled up to ${newLevel}`)
              }}
            />
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12 bg-blue-950 border border-blue-800 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-blue-100 mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-blue-100 mb-2">How do I get Skillpoints?</h3>
            <p className="text-blue-200 text-sm">
              You earn Skillpoints when you level up (1-5 per level depending on your level bracket). 
              You also earn 1 Skillpoint each time you complete a Job!
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-blue-100 mb-2">What do Core Attributes do?</h3>
            <p className="text-blue-200 text-sm">
              Each attribute provides a system-wide bonus:
            </p>
            <ul className="text-blue-200 text-sm mt-2 space-y-1 ml-4">
              <li>• <strong>Time Management</strong>: Increases XP gained from all sources</li>
              <li>• <strong>Focus</strong>: Speeds up learning new skills</li>
              <li>• <strong>Leadership</strong>: Boosts job and quest rewards</li>
              <li>• <strong>Communication</strong>: Increases reputation gains</li>
              <li>• <strong>Consistency</strong>: Enhances daily streak bonuses</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-blue-100 mb-2">Can I reset my attributes?</h3>
            <p className="text-blue-200 text-sm">
              Currently, once you spend a Skillpoint on an attribute, it's permanent. 
              However, you continue earning Skillpoints over time, so you can specialize 
              multiple attributes as you progress.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-blue-100 mb-2">What's the effect power score?</h3>
            <p className="text-blue-200 text-sm">
              The Effect Power score (0-100) shows the combined strength of all your attribute bonuses. 
              Higher power means bigger bonuses across the system. The maximum is 100 when all 
              attributes are at level 10.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-blue-100 mb-2">Should I focus on one attribute or spread them?</h3>
            <p className="text-blue-200 text-sm">
              That's up to you! Focus on one if you want to maximize a specific bonus, 
              or spread them out for balanced benefits. As you progress, you'll have enough 
              Skillpoints to develop all attributes eventually.
            </p>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-green-950 border border-green-800 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-green-100 mb-4">Pro Tips</h2>
        
        <ul className="space-y-3 text-green-100 text-sm">
          <li className="flex gap-3">
            <span className="text-lg">💡</span>
            <span><strong>Time Management first:</strong> Get +20% XP on everything else you do</span>
          </li>
          <li className="flex gap-3">
            <span className="text-lg">💡</span>
            <span><strong>Pair Leadership with Jobs:</strong> Each job pays more with high Leadership</span>
          </li>
          <li className="flex gap-3">
            <span className="text-lg">💡</span>
            <span><strong>Communication for social:</strong> Get more reputation from all actions</span>
          </li>
          <li className="flex gap-3">
            <span className="text-lg">💡</span>
            <span><strong>Consistency matters:</strong> Daily activity becomes more rewarding</span>
          </li>
          <li className="flex gap-3">
            <span className="text-lg">💡</span>
            <span><strong>Don't worry about balance:</strong> You'll eventually max all attributes</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
