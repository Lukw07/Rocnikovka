import { Metadata } from "next"
import { auth } from "@/app/lib/auth"
import { redirect } from "next/navigation"
import WalletCard from "@/app/components/wallet/wallet-card"
import { Wallet } from "lucide-react"

export const metadata: Metadata = {
  title: "Wallet | EduRPG",
  description: "Zůstatek a transakční historie"
}

export default async function WalletPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">Sledujte zůstatek a transakce</p>
        </div>
      </div>

      <WalletCard />
    </div>
  )
}
