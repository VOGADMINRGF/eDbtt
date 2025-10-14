"use client";
import { useEffect, useState } from "react";
import SwipeCard from "./SwipeCard";

export default function SwipeDeck({ userHash }: { userHash: string }) {
  const [statements, setStatements] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("/api/swipeStatements")
      .then(res => res.json())
      .then(data => setStatements(data));
  }, []);

  if (!statements.length) return <div>Lade Statements…</div>;
  if (current >= statements.length) return <div>Alle Statements beantwortet!</div>;

  return (
    <SwipeCard
      statement={statements[current]}
      userHash={userHash}
      onVote={() => setCurrent((c) => c + 1)}
    />
  );
}
