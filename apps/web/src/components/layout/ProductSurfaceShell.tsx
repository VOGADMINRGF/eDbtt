import type { ReactNode } from "react";
import {
  PRODUCT_SURFACE_MAIN_CLASSNAME,
  PRODUCT_SURFACE_SHELL_CLASSNAME,
} from "@/features/wrapper/productSurfaceLayoutContract";

type Props = {
  children: ReactNode;
  mainClassName?: string;
  shellClassName?: string;
};

function cx(...classes: Array<string | null | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ProductSurfaceShell({ children, mainClassName, shellClassName }: Props) {
  return (
    <main data-product-surface-root="true" className={cx(PRODUCT_SURFACE_MAIN_CLASSNAME, mainClassName)}>
      <section data-product-surface-shell="true" className={cx(PRODUCT_SURFACE_SHELL_CLASSNAME, shellClassName)}>
        {children}
      </section>
    </main>
  );
}
