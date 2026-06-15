import { SmilePlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import type { MessageReactionSummary } from "@/shared/types";

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "😮", "😢"];

// Row of reaction chips shown under a message; click a chip to toggle your reaction.
export function MessageReactions({
  reactions,
  myId,
  onToggle,
}: {
  reactions?: MessageReactionSummary[];
  myId?: string;
  onToggle: (emoji: string) => void;
}) {
  if (!reactions || reactions.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {reactions.map((r) => {
        const mine = myId ? r.userIds.includes(myId) : false;
        return (
          <button
            key={r.emoji}
            onClick={() => onToggle(r.emoji)}
            className={`flex items-center gap-1 px-1.5 h-5 rounded-full border text-[11px] cursor-pointer transition-colors ${
              mine
                ? "bg-[#137FEC]/10 border-[#137FEC]/40 text-[#137FEC]"
                : "bg-[#F1F5F9] border-transparent text-[#475569] hover:bg-[#E2E8F0]"
            }`}
          >
            <span>{r.emoji}</span>
            <span className="font-medium">{r.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// Hover "add reaction" button with a small emoji palette.
export function ReactionPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Add reaction"
          className="p-1 rounded hover:bg-[#E2E8F0] text-[#94A3B8] cursor-pointer"
        >
          <SmilePlus className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex gap-0.5 p-1 min-w-0 w-auto">
        {REACTION_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => onPick(e)}
            className="text-base leading-none rounded px-1 py-0.5 hover:bg-[#F1F5F9] cursor-pointer"
          >
            {e}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
