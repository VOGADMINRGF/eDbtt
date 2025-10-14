"use client";
import { useState } from "react";
import { Project } from "../types/ProjectType";

export default function ProjectForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [region, setRegion] = useState("");
  const [organizerIds, setOrganizerIds] = useState<string[]>(["user-xyz"]);
  const [status, setStatus] = useState<"planned" | "active" | "completed" | "archived">("planned");

  const handleSubmit = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      startDate,
      endDate: endDate || undefined,
      region: region || undefined,
      organizerIds,
      status,
      createdAt: new Date().toISOString(),
    };

    console.log("Neues Projekt:", newProject);
    // Hier API-Aufruf oder Speicherung
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      <h2 className="text-2xl font-bold text-coral">Projekt/Event erstellen</h2>
      <input
        type="text"
        placeholder="Projektname"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />
      <textarea
        placeholder="Beschreibung"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />
      <div className="grid grid-cols-2 gap-4">
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />
      </div>
      <input
        type="text"
        placeholder="Region (optional)"
        value={region}
        onChange={e => setRegion(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />
      <div>
        <label>Status:</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as any)}
          className="border px-3 py-2 rounded"
        >
          <option value="planned">Geplant</option>
          <option value="active">Aktiv</option>
          <option value="completed">Abgeschlossen</option>
          <option value="archived">Archiviert</option>
        </select>
      </div>
      {/* Organizer-IDs sind normalerweise automatisiert oder aus dem Auth-Kontext */}
      <button onClick={handleSubmit} className="bg-coral text-white font-semibold px-6 py-3 rounded hover:opacity-90">
        Projekt speichern
      </button>
    </div>
  );
}
