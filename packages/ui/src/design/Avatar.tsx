"use client";
import * as React from "react";

type AvatarRootProps = React.HTMLAttributes<HTMLDivElement>;
export default function Avatar({ className, ...rest }: AvatarRootProps) {
  return <div className={["inline-flex items-center justify-center rounded-full bg-muted", className].filter(Boolean).join(" ")} {...rest} />;
}
