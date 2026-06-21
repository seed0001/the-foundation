import { cn } from "@/lib/utils";

export function Avatar({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 select-none items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground",
        className,
      )}
    >
      {initials}
    </span>
  );
}
