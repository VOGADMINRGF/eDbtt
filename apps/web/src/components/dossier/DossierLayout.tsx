import type { ReactNode } from "react";

type DossierLayoutProps = {
  header: ReactNode;
  mainLeft: ReactNode;
  sidebar: ReactNode;
  fullWidth?: ReactNode;
  afterLeft?: ReactNode;
  afterSidebar?: ReactNode;
};

export function DossierLayout({
  header,
  mainLeft,
  sidebar,
  fullWidth,
  afterLeft,
  afterSidebar,
}: DossierLayoutProps) {
  return (
    <section className="space-y-12">
      {header}

      <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-10">{mainLeft}</div>
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">{sidebar}</aside>
      </div>

      {fullWidth ? (
        <div className="space-y-6">{fullWidth}</div>
      ) : null}

      {afterLeft || afterSidebar ? (
        <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-10">{afterLeft}</div>
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">{afterSidebar}</aside>
        </div>
      ) : null}
    </section>
  );
}

export default DossierLayout;
