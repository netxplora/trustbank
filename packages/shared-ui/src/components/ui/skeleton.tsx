import { cn } from "@trustbank/shared-utils/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-muted/60 dark:bg-muted/30", className)}
      {...props}
    >
      <div
        className="absolute inset-0 z-10"
        style={{
          backgroundSize: "200% 100%",
          backgroundImage: "linear-gradient(90deg, transparent, rgba(150, 150, 150, 0.1), transparent)",
          animation: "shimmer 1.5s linear infinite",
        }}
      />
    </div>
  );
}

export { Skeleton };
