import { PawPrint } from "lucide-react";

export function Loading({ label = "Carregando o tribunal..." }: { label?: string }) {
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <PawPrint className="size-12 text-primary motion-safe:animate-bob" strokeWidth={2.5} />
      <p className="font-display text-xl font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

// Tela de aviso (sala não existe, sem permissão...) com uma ação para sair dela
export function RoomMessage({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 py-16 text-center motion-safe:animate-rise">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      {children && <div className="text-lg text-muted-foreground">{children}</div>}
      {action}
    </div>
  );
}
