// features/dashboard/components/SidebarNav.tsx
import type { ReactNode, ComponentType } from "react";

type LinkLikeProps = { href: string; className?: string; children?: ReactNode };
export type LinkLike = ComponentType<LinkLikeProps>;

type Item = { href: string; title: string };
export default function SidebarNav({
  items,
  LinkComponent = (props: LinkLikeProps) => <a {...props} />, // Fallback: <a>
}: {
  items: Item[];
  LinkComponent?: LinkLike;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => (
        <LinkComponent key={it.href} href={it.href} className="px-3 py-2 rounded hover:underline">
          {it.title}
        </LinkComponent>
      ))}
    </nav>
  );
}
