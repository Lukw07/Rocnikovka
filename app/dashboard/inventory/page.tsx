import { Metadata } from "next"
import { auth } from "@/app/lib/auth"
import { redirect } from "next/navigation"
import InventoryGrid from "@/app/components/inventory/inventory-grid"
import { Package } from "lucide-react"

export const metadata: Metadata = {
  title: "Inventář | EduRPG",
  description: "Správa vašich předmětů"
}

export default async function InventoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Inventář</h1>
          <p className="text-muted-foreground">Prohlédněte a používejte své předměty</p>
        </div>
      </div>

      <InventoryGrid />
    </div>
  )
}
