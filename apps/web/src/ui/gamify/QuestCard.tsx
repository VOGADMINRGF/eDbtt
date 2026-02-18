"use client";
import React from "react";
export default function QuestCard({title,subtitle,children,step}:{title:string;subtitle?:string;children:React.ReactNode;step:number}) {
  return (
    <div className="vog-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Quest {step}</div>
          <div className="font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-[rgb(var(--muted))]">{subtitle}</div>}
        </div>
        <div className="text-2xl">🎯</div>
      </div>
      {children}
    </div>
  );
}
