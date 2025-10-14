import React from "react";
export default function Badge({
  children,
  className,
}: {
  children?: any;
  className?: string;
}) {
  return <span className={className}>{children}</span>;
}
