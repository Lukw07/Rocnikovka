"use client";

import { useRouter } from "next/navigation";
import { TransferLeadershipDialog as Dialog } from "./transfer-leadership-dialog";

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

interface TransferLeadershipWrapperProps {
  guildId: string;
  members: Member[];
  currentUserId: string;
}

export function TransferLeadershipWrapper({
  guildId,
  members,
  currentUserId,
}: TransferLeadershipWrapperProps) {
  const router = useRouter();

  return (
    <Dialog
      guildId={guildId}
      members={members}
      currentUserId={currentUserId}
      onTransferComplete={() => {
        router.refresh();
      }}
    />
  );
}
