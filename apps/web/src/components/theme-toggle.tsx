"use client";

import { Moon, Sun } from "lucide-react";

// Cada clique usa o próximo efeito (o contador vive no módulo, então sobrevive à navegação).
// O botão fica no canto superior direito, então retângulo e círculo nascem dali.
const EFEITOS = ["rectangle", "circle-blur", "blinds"] as const;
let proximoEfeito = 0;

function trocar(tema: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", tema);
  try {
    localStorage.setItem("theme", tema);
  } catch {}
}

export function ThemeToggle() {
  function onClick() {
    const root = document.documentElement;
    const tema = root.getAttribute("data-theme") === "dark" ? "light" : "dark";

    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return trocar(tema);
    }

    const efeito = EFEITOS[proximoEfeito];
    proximoEfeito = (proximoEfeito + 1) % EFEITOS.length;
    root.style.setProperty("--vt-from", "inset(0 0 100% 100%)");
    root.style.setProperty("--vt-origin", "100% 0%");
    root.setAttribute("data-vt", efeito);

    document.startViewTransition(() => trocar(tema)).finished.finally(() => {
      root.removeAttribute("data-vt");
    });
  }

  // Os dois ícones ficam no HTML e o CSS escolhe qual mostrar, então não há flash na hidratação
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Alternar tema claro e escuro"
      className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:rotate-12 hover:scale-110"
    >
      <Moon className="size-5 dark:hidden" />
      <Sun className="hidden size-5 dark:block" />
    </button>
  );
}
