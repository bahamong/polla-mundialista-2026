/* eslint-disable @next/next/no-img-element */
import type { Team } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TeamFlag({
  team,
  placeholder,
  className,
  showName = true,
  align = "left",
}: {
  team?: Team | null;
  placeholder?: string | null;
  className?: string;
  showName?: boolean;
  align?: "left" | "right";
}) {
  const name = team?.name ?? placeholder ?? "Por definir";
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        align === "right" && "flex-row-reverse text-right",
        className,
      )}
    >
      {team?.flag_url ? (
        <img
          src={team.flag_url}
          alt={name}
          className="h-5 w-7 rounded-sm object-cover ring-1 ring-border"
        />
      ) : (
        <span className="flex h-5 w-7 items-center justify-center rounded-sm bg-muted text-[10px] text-muted-foreground">
          ?
        </span>
      )}
      {showName && <span className="font-medium">{name}</span>}
    </div>
  );
}
