import * as React from "react";

export default function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = "", ...rest } = props;
  return <div className={`rounded-xl border bg-white shadow-sm ${className}`} {...rest} />;
}
export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="p-4 border-b" {...props} />;
}
export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="p-4" {...props} />;
}
export function CardFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="p-4 border-t bg-neutral-50" {...props} />;
}
