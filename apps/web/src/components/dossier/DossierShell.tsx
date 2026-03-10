import type { ReactNode } from "react";

type DossierShellProps = {
  children: ReactNode;
  className?: string;
};

export function DossierShell({ children, className }: DossierShellProps) {
  return (
    <main
      className={`dossier-editorial min-h-screen bg-[radial-gradient(circle_at_top,var(--dossier-top)_0%,var(--dossier-mid)_45%,var(--dossier-bottom)_100%)] text-[rgb(var(--fg))] ${
        className ?? ""
      }`.trim()}
    >
      {children}
    </main>
  );
}

export default DossierShell;
