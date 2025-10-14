// packages/ui/src/components/Toast.tsx
"use client";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  duration?: number;
  type?: "info" | "success" | "error";
}

export default function Toast({ message, duration = 3000, type = "info" }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!visible) return null;

  const bg = {
    info: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  }[type];

  return (
    <div className={`fixed top-4 right-4 px-4 py-2 rounded shadow ${bg} z-50`}>
      {message}
    </div>
  );
}
