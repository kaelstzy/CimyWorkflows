import type { ConversationStatus } from "@/types/conversation";

const STYLES: Record<ConversationStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  flagged: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  archived: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
};

export function StatusBadge({ status }: { status: ConversationStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
