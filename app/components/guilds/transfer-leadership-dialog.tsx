"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Crown, UserCheck } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface Member {
  id: string;
  userId: string;
  role: "LEADER" | "OFFICER" | "MEMBER";
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface TransferLeadershipDialogProps {
  guildId: string;
  members: Member[];
  currentUserId: string;
  onTransferComplete: () => void;
}

export function TransferLeadershipDialog({
  guildId,
  members,
  currentUserId,
  onTransferComplete,
}: TransferLeadershipDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out current user from potential leaders
  const eligibleMembers = members.filter(
    (m) => m.userId !== currentUserId
  );

  const handleTransfer = async () => {
    if (!selectedMemberId) {
      setError("Vyber nového vůdce");
      return;
    }

    setIsTransferring(true);
    setError(null);

    try {
      const response = await fetch(`/api/guilds/${guildId}/transfer-leadership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newLeaderId: selectedMemberId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to transfer leadership");
      }

      setOpen(false);
      onTransferComplete();
    } catch (err: any) {
      setError(err.message || "Chyba při přenosu vedení");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Crown className="w-4 h-4" />
          Přenést vedení
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Přenést vedení guildy</DialogTitle>
          <DialogDescription>
            Vyber člena, kterému chceš předat roli vůdce guildy. Tvoje role se změní
            na oficíra.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {eligibleMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nemáš žádné další členy v guildě. Pozvi někoho, aby se mohl stát
              vůdcem.
            </p>
          ) : (
            eligibleMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.userId)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:bg-accent",
                  selectedMemberId === member.userId
                    ? "border-primary bg-accent"
                    : "border-transparent"
                )}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.user.avatarUrl || undefined} />
                  <AvatarFallback>
                    {member.user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-medium">{member.user.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {member.role === "OFFICER" ? "Oficír" : "Člen"}
                  </div>
                </div>
                {selectedMemberId === member.userId && (
                  <UserCheck className="w-5 h-5 text-primary" />
                )}
              </button>
            ))
          )}
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isTransferring}
          >
            Zrušit
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedMemberId || isTransferring || eligibleMembers.length === 0}
          >
            {isTransferring ? "Přenášení..." : "Potvrdit přenos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
