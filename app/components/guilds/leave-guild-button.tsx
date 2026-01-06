"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { LogOut } from "lucide-react";

interface LeaveGuildButtonProps {
  guildId: string;
  guildName: string;
}

export function LeaveGuildButton({ guildId, guildName }: LeaveGuildButtonProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleLeave = async () => {
    setIsLeaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/guilds/${guildId}/leave`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nepodařilo se opustit guildu");
      }

      // Redirect to guilds list
      router.push("/dashboard/guilds");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsLeaving(false);
    }
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Opustit guildu
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opustit guildu {guildName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chceš opustit tuto guildu? Ztratíš přístup ke všem guild
              funkcím a benefitům.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} disabled={isLeaving}>
              {isLeaving ? "Opouštím..." : "Opustit guildu"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
