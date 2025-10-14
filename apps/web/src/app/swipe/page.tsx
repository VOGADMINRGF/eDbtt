"use client";
import React from "react";
import SwipeDeck from "@features/swipe/components/SwipeDeck";

export default function Page() {
  return (
    <main style={{ padding: 16 }}>
      <h1>Swipe</h1>
      <SwipeDeck userHash={"anon"} />
    </main>
  );
}
