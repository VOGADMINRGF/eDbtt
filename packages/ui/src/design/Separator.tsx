"use client";
import * as React from "react";

export type SeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};
export default function Separator({ orientation = "horizontal", className, ...rest }: SeparatorProps) {
  return (
    <div
      role="separator"
      className={["bg-border", orientation === "vertical" ? "w-px h-4" : "h-px w-full", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
