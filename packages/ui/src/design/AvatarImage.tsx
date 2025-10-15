"use client";
import * as React from "react";
export default function AvatarImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} className={["h-full w-full rounded-full object-cover", props.className].filter(Boolean).join(" ")} />;
}
