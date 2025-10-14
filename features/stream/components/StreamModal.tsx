"use client";

import Badge from "@ui/design/Badge";
import Modal from "@ui/design/Modal";
import VideoPlayer from "./VideoPlayer";
import SwipeCard from "@features/swipe/components/SwipeCard";
import { useState } from "react";

interface Statement {
  _id: string;
  translations: { language: string; text: string }[];
  votes: {
    agree: number;
    disagree: number;
    neutral: number;
    requiredMajority: number;
  };
  alternativeStatements?: { text: string; votes: any }[];
}

interface Props {
  id: string;
  title: string;
  status: string;
  region: string;
  topic: string;
  language: string;
  viewers: number;
  trailerUrl?: string;
  image?: string;
  description: string;
  statements?: Statement[];
  userId: string;
  onClose: () => void;
}

export default function StreamModal({
  id,
  title,
  status,
  region,
  topic,
  language,
  viewers,
  trailerUrl,
  image,
  description,
  statements,
  userId,
  onClose,
}: Props) {
  const [currentStatementIndex, setCurrentStatementIndex] = useState(0);

  const handleNextStatement = () => {
    if (statements && currentStatementIndex < statements.length - 1) {
      setCurrentStatementIndex(currentStatementIndex + 1);
    } else {
      setCurrentStatementIndex(0);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="">
      {/* Titel & Status */}
      <div className="flex items-start justify-between mb-2">
        <h2 className="text-xl font-bold text-coral">{title}</h2>
        <Badge
          text={status}
          color={
            status === "Live"
              ? "bg-red-500"
              : status === "Geplant"
              ? "bg-teal-500"
              : "bg-gray-500"
          }
        />
      </div>

      {/* Titelbild */}
      {image && (
        <div className="flex justify-center mb-3">
          <img
            src={image}
            alt={title}
            className="rounded-lg object-cover w-24 h-24 shadow border"
          />
        </div>
      )}

      {/* Trailer */}
      {trailerUrl && (
        <div className="mb-3">
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-700 font-semibold">
            🎬 Trailer zu <span className="text-coral">{title}</span>
          </div>
          <div className="rounded-2xl overflow-hidden">
            <VideoPlayer
              src={trailerUrl}
              title={`Trailer zu ${title}`}
              controls
              poster={image}
            />
          </div>
        </div>
      )}

      {/* Beschreibung & Metadaten */}
      <div className="mb-2">
        <p className="text-gray-700">{description}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
          <span>{region}</span>
          <span>· {topic}</span>
          <span>· Sprache: {language}</span>
        </div>
        <div className="text-xs text-gray-500">{viewers} Zuschauer:innen</div>
      </div>

      {/* Statements & Swipe Integration */}
      {statements && statements.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <SwipeCard
            statement={statements[currentStatementIndex]}
            userId={userId}
          />
          <button
            onClick={handleNextStatement}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            Nächstes Statement ➡️
          </button>
        </div>
      )}
    </Modal>
  );
}
