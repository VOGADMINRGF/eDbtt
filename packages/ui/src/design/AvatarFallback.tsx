"use client";
import * as React from "react";
export default function AvatarFallback({ children }: { children?: React.ReactNode }) {
  return <div className="h-8 w-8 rounded-full bg-neutral-300 grid place-items-center text-xs">{children}</div>;
}
