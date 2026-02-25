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
    <section className="space-y-16 leading-relaxed">
      {header}

      <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-12">{mainLeft}</div>
        <aside className="space-y-8 lg:sticky lg:top-8 lg:self-start">{sidebar}</aside>
      </div>

      {fullWidth ? (
        <div className="space-y-8">{fullWidth}</div>
      ) : null}

      {afterLeft || afterSidebar ? (
        afterSidebar ? (
          <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr]">
            <div className="space-y-12">{afterLeft}</div>
            <aside className="space-y-8 lg:sticky lg:top-8 lg:self-start">{afterSidebar}</aside>
          </div>
        ) : (
          <div className="space-y-12">{afterLeft}</div>
        )
      ) : null}
    </section>
  );
}

export default DossierLayout;
