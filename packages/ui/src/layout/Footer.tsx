import * as React from "react";
import Link from "next/link";

export type FooterLink = { href: string; label: string; target?: "_blank" | "_self" };
export type FooterProps = {
  columns?: Array<{ title?: string; links: FooterLink[] }>;
  copyright?: string;
  className?: string;
};

const THIS_YEAR = new Date().getFullYear();

export default function Footer({
  columns = [
    { title: "Produkt", links: [{ href: "/reports", label: "Reports" }, { href: "/statements", label: "Statements" }] },
    { title: "Rechtliches", links: [{ href: "/impressum", label: "Impressum" }, { href: "/datenschutz", label: "Datenschutz" }] }
  ],
  copyright = `© ${THIS_YEAR} Voice Open Gov`,
  className
}: FooterProps) {
  return (
    <footer className={`border-t bg-white ${className ?? ""}`}>
      <div className="mx-auto max-w-7xl px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {columns.map((col, idx) => (
          <div key={idx}>
            {col.title && <div className="font-semibold mb-2">{col.title}</div>}
            <ul className="space-y-1 text-sm">
              {col.links.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <Link href={l.href} target={l.target} className="text-neutral-700 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t py-3 text-xs text-neutral-500 text-center">{copyright}</div>
    </footer>
  );
}
