import { PawPrint, Scale } from "lucide-react";

function OBadge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className={`mx-[0.03em] inline-flex h-[0.9em] w-[0.72em] items-center justify-center rounded-full text-[#2a2040] ${className}`}
    >
      {children}
    </span>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Cathoot"
      className={`inline-flex items-center font-display font-bold leading-none tracking-tight text-foreground ${className}`}
    >
      <span aria-hidden>CATH</span>
      <OBadge className="bg-accent">
        <PawPrint className="size-[0.5em]" strokeWidth={2.5} />
      </OBadge>
      <OBadge className="bg-[#a88fe0]">
        <Scale className="size-[0.5em]" strokeWidth={2.5} />
      </OBadge>
      <span aria-hidden>T</span>
    </span>
  );
}
