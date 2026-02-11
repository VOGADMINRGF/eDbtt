"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import PublicPageShell from "@/components/layout/PublicPageShell";
import { useLocale } from "@/context/LocaleContext";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";

type Room = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status?: string;
  tags?: string[];
};

type Message = {
  id: string;
  body: string;
  authorIdMasked?: string | null;
  createdAt?: string | null;
};

type LoadState = "idle" | "loading" | "error";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.valueOf())) return "—";
  return dt.toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CommunityRoomsPage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "community-rooms" });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomsState, setRoomsState] = useState<LoadState>("idle");
  const [messagesState, setMessagesState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedId) ?? null,
    [rooms, selectedId],
  );

  const loadRooms = useCallback(async () => {
    setRoomsState("loading");
    setError(null);
    try {
      const res = await fetch("/api/community/rooms", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || res.statusText);
      const items = Array.isArray(body?.items) ? body.items : [];
      setRooms(items);
      if (items.length) {
        setSelectedId((prev) => prev ?? items[0].id);
      }
    } catch (err: any) {
      setRooms([]);
      setError(err?.message ?? "Rooms konnten nicht geladen werden.");
    } finally {
      setRoomsState("idle");
    }
  }, []);

  const loadMessages = useCallback(async (roomId: string) => {
    setMessagesState("loading");
    setError(null);
    try {
      const res = await fetch(`/api/community/rooms/${roomId}/messages`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || res.statusText);
      const items = Array.isArray(body?.items) ? body.items : [];
      setMessages(items);
    } catch (err: any) {
      setMessages([]);
      setError(err?.message ?? "Messages konnten nicht geladen werden.");
    } finally {
      setMessagesState("idle");
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    }
  }, [selectedId, loadMessages]);

  const handleSend = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!selectedId || !messageText.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/community/rooms/${selectedId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: messageText.trim(), locale }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || res.statusText);
      setMessageText("");
      await loadMessages(selectedId);
    } catch (err: any) {
      setError(err?.message ?? "Senden fehlgeschlagen.");
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicPageShell contentClassName="max-w-6xl">
      <div className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("Community", "label")}</p>
        <h1 className="text-3xl font-bold text-slate-900">{t("Community Rooms", "title")}</h1>
        <p className="text-sm text-slate-600">
          {t(
            "Offene Räume für lokale Updates, Aktionen und Diskussionen. Beiträge werden moderiert und sind für verifizierte Nutzer verfügbar.",
            "subtitle",
          )}
        </p>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">{t("Räume", "rooms.title")}</h2>
            <span className="text-xs text-slate-400">{rooms.length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {roomsState === "loading" && (
              <p className="text-sm text-slate-500">{t("Lädt Räume…", "rooms.loading")}</p>
            )}
            {roomsState !== "loading" && rooms.length === 0 && (
              <p className="text-sm text-slate-500">{t("Noch keine Räume vorhanden.", "rooms.empty")}</p>
            )}
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedId(room.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                  selectedId === room.id
                    ? "border-slate-300 bg-slate-100 text-slate-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="font-semibold">{room.title}</div>
                <div className="text-xs text-slate-500">{room.description || t("Ohne Beschreibung.", "rooms.desc")}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {selectedRoom ? (
            <>
              <header className="flex flex-col gap-2 border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                    {selectedRoom.status ?? "open"}
                  </span>
                  {selectedRoom.tags?.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-500">
                      #{tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">{selectedRoom.title}</h2>
                <p className="text-sm text-slate-600">{selectedRoom.description || t("Ohne Beschreibung.", "room.desc")}</p>
              </header>

              <div className="mt-4 space-y-3">
                {messagesState === "loading" && (
                  <p className="text-sm text-slate-500">{t("Lädt Nachrichten…", "messages.loading")}</p>
                )}
                {messagesState !== "loading" && messages.length === 0 && (
                  <p className="text-sm text-slate-500">{t("Noch keine Nachrichten.", "messages.empty")}</p>
                )}
                {messages.map((message) => (
                  <article key={message.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{message.authorIdMasked ?? t("Anonym", "messages.anonymous")}</span>
                      <span>{formatDateTime(message.createdAt ?? null)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{message.body}</p>
                  </article>
                ))}
              </div>

              <form onSubmit={handleSend} className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                <label className="flex flex-col gap-2 text-sm text-slate-600">
                  {t("Neue Nachricht", "composer.label")}
                  <textarea
                    required
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={t("Teile ein Update, eine Frage oder eine Einladung…", "composer.placeholder")}
                    className="min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  />
                </label>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {t("Nur verifizierte Nutzer können schreiben. Beiträge werden moderiert.", "composer.hint")}
                  </p>
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {sending ? t("Sende…", "composer.sending") : t("Senden", "composer.send")}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center text-sm text-slate-500">{t("Bitte einen Raum auswählen.", "rooms.select")}</div>
          )}
        </section>
      </div>
    </PublicPageShell>
  );
}
