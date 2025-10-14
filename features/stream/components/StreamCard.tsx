// Finale Version 2025 
 
"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Badge from "@ui/design/Badge";
import StreamModal from "./StreamModal";
import { badgeColors } from "@ui/design/badgeColor";
import { getNationalFlag } from "@features/stream/utils/nationalFlag";

// Typen, falls benötigt
interface StreamCardProps {
  id: string;
  title: string;
  status: string;
  region?: string;
  regionScope?: string[];
  topic?: string;
  language: string;
  viewers?: number;
  image?: string;
  trailerUrl?: string;
  description?: string;
  statements?: { agreed: number; rejected: number; unanswered: number };
  supporter?: string;
  tags?: string[];
  date?: string;
  beitragVerfuegbar?: boolean;
  accessibilityStatus?: string;
  barrierescore?: number;
  aiAnnotations?: any;
  translations?: Record<string, any>;
}

function isMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 640 || "ontouchstart" in window;
}

export default function StreamCard(props: StreamCardProps) {
  const {
    id,
    title,
    status,
    region,
    regionScope = [],
    topic,
    language = "de",
    viewers,
    image,
    trailerUrl,
    description,
    statements = { agreed: 0, rejected: 0, unanswered: 0 },
    tags = [],
    date,
    beitragVerfuegbar,
    accessibilityStatus,
    barrierescore,
    aiAnnotations,
    translations = {},
  } = props;

  const [modalOpen, setModalOpen] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false); // Für Desktop-Hover-Trailer
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setIsMobileDevice(isMobile());
    const resize = () => setIsMobileDevice(isMobile());
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Übersetzung
  const translated = useMemo(() => translations?.[language] ?? {}, [translations, language]);
  const titleToShow = translated.title || title;

  // KI & Accessibility
  const ai = aiAnnotations || {};
  const hasAI =
    ai && (ai.toxicity != null || ai.sentiment != null || (Array.isArray(ai.subjectAreas) && ai.subjectAreas.length > 0));

  const srcToUse = !image
    ? "/dummy/dummy1.jpg"
    : image.startsWith("/")
    ? image
    : `/dummy/${image}`;
  const CARD_HEIGHT = 190;

  // *** MOBILE: Blockstruktur ***
  if (isMobileDevice) {
    return (
      <div className="rounded-2xl shadow-md bg-white overflow-hidden border mb-5 w-full flex flex-col">
        {/* Titel */}
        <h3 className="font-bold text-coral text-lg px-4 pt-3 pb-2">{titleToShow}</h3>
        {/* Bild */}
        <div className="relative w-full h-[180px] flex items-center justify-center bg-gray-100 overflow-hidden">
          <img
            src={srcToUse}
            alt={titleToShow}
            className="object-cover w-full h-full"
            draggable={false}
          />
          {/* Status-Badge oben links */}
          <span className="absolute top-2 left-2 z-10">
            <Badge text={status} className="text-xs p-1" />
          </span>
        </div>
        {/* Tags + Flaggen */}
        <div className="flex flex-wrap gap-2 px-4 pt-1">
          {tags.map((tag, i) => (
            <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-bold border ${badgeColors[i % badgeColors.length]}`}>
              {tag}
            </span>
          ))}
          {regionScope?.map(cc => (
            <span key={cc} className="mx-1 text-lg">{getNationalFlag(cc)}</span>
          ))}
        </div>
        {/* Statements */}
        <div className="flex justify-around gap-1 px-4 py-2 font-bold text-base">
          <span className="flex items-center gap-1 text-green-700">👍 {statements.agreed}</span>
          <span className="flex items-center gap-1 text-red-700">👎 {statements.rejected}</span>
          <span className="flex items-center gap-1 text-yellow-700">❓ {statements.unanswered}</span>
        </div>
        {/* Links */}
        <div className="flex flex-col gap-2 px-4 pb-2">
          {trailerUrl && (
            <a
              href="#"
              className="block bg-coral text-white font-bold px-3 py-1 rounded-full shadow text-center hover:scale-105 transition"
              onClick={e => {
                e.preventDefault();
                setModalOpen(true);
              }}
            >
              {status === "Geplant" ? "Stream vormerken" : "Zum Stream"}
            </a>
          )}
          <a
            href={beitragVerfuegbar ? `/beitrag/${id}` : undefined}
            className={`block font-bold px-3 py-1 rounded-full shadow text-center hover:scale-105 transition ${
              beitragVerfuegbar
                ? "bg-indigo-600 text-white"
                : "bg-white border-2 border-gray-300 text-gray-400 cursor-not-allowed"
            }`}
            style={beitragVerfuegbar ? {} : { pointerEvents: "none", opacity: 0.5 }}
            aria-disabled={!beitragVerfuegbar}
            tabIndex={beitragVerfuegbar ? 0 : -1}
            title={beitragVerfuegbar ? "Zum Beitrag" : "Demnächst verfügbar"}
          >
            Zum Beitrag
          </a>
        </div>
        {/* Accessibility / KI-Analyse */}
        {(accessibilityStatus || typeof barrierescore === "number") && (
          <div className="flex gap-2 items-center text-xs mb-1 px-4" aria-label="Barrierefreiheit">
            {accessibilityStatus && (
              <span className="rounded bg-green-50 text-green-700 px-2 py-1 font-bold">
                Accessibility: {accessibilityStatus}
              </span>
            )}
            {typeof barrierescore === "number" && (
              <span>
                Barrierefreiheits-Score: {barrierescore}/100
              </span>
            )}
          </div>
        )}
        {hasAI && (
          <div className="text-xs text-gray-500 mt-1 px-4" aria-label="KI-Analyse">
            {ai.toxicity != null && <>Toxizität: {(ai.toxicity * 100).toFixed(2)} % </>}
            {ai.sentiment != null && <>Stimmung: {ai.sentiment} </>}
            {Array.isArray(ai.subjectAreas) && ai.subjectAreas.length > 0 && (
              <>Themen: {ai.subjectAreas.join(", ")}</>
            )}
          </div>
        )}
        {/* Metadaten */}
        <div className="px-4 pb-3 pt-1 text-xs text-gray-400 text-right">
          {region} · {topic} · <span className="uppercase">{language}</span>
          <br />
          {viewers} Beteiligte
          {date && (
            <span className="block text-[10px] text-gray-300">
              {new Date(date).toLocaleDateString("de-DE")}
            </span>
          )}
        </div>
        {/* Modal */}
        {modalOpen && trailerUrl && (
          <StreamModal
            id={id}
            title={titleToShow}
            status={status}
            region={region}
            topic={topic}
            language={language}
            viewers={viewers}
            trailerUrl={trailerUrl}
            image={image}
            description={description}
            statements={statements}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>
    );
  }

  // *** DESKTOP ***
  return (
    <>
      <div
        className="rounded-2xl shadow-md bg-white overflow-hidden hover:shadow-lg transition-all border mb-5 flex flex-row w-full relative"
        style={{ minHeight: CARD_HEIGHT, maxHeight: CARD_HEIGHT }}
        onMouseEnter={() => { if (trailerUrl) setShowTrailer(true); }}
        onMouseLeave={() => {
          setShowTrailer(false);
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
        }}
      >
        <div
          className="flex-shrink-0 w-[180px] h-full flex items-center justify-center bg-gray-100 overflow-hidden relative"
          style={{ height: CARD_HEIGHT }}
        >
          {showTrailer && trailerUrl ? (
            <video
              ref={videoRef}
              src={trailerUrl}
              autoPlay
              muted
              playsInline
              loop
              poster={srcToUse}
              className="w-full h-full object-cover transition-all"
              style={{ height: CARD_HEIGHT }}
            />
          ) : (
            <img
              src={srcToUse}
              alt={titleToShow}
              className="object-cover w-full h-full transition-all"
              style={{ height: CARD_HEIGHT }}
              draggable={false}
            />
          )}
          <span className="absolute top-2 left-2 z-10">
            <Badge text={status} />
          </span>
        </div>
        <div className="flex flex-col flex-1 justify-between px-4 py-3 gap-2">
          <div>
            <h3 className="font-bold text-coral text-lg truncate">{titleToShow}</h3>
            <div className="flex flex-wrap gap-1 mb-1">
              {tags.map((tag, i) => (
                <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-bold border ${badgeColors[i % badgeColors.length]}`}>
                  {tag}
                </span>
              ))}
              {regionScope?.map(cc => (
                <span key={cc} className="mx-1 text-lg">{getNationalFlag(cc)}</span>
              ))}
            </div>
            <div className="text-sm text-gray-600 mb-1">{description}</div>
          </div>
          <div>
            <div className="flex gap-2 text-base font-bold mb-3">
              <span className="flex items-center gap-1 text-green-700">👍 {statements.agreed}</span>
              <span className="flex items-center gap-1 text-red-700">👎 {statements.rejected}</span>
              <span className="flex items-center gap-1 text-yellow-700">❓ {statements.unanswered}</span>
            </div>
            <div className="flex gap-3 mt-1">
              <button
                className="bg-coral text-white font-bold px-3 py-1 rounded-full shadow hover:scale-105 transition"
                onClick={() => setModalOpen(true)}
              >
                {status === "Geplant" ? "Stream vormerken" : "Zum Stream"}
              </button>
              <a
                href={beitragVerfuegbar ? `/beitrag/${id}` : undefined}
                className={`font-bold px-3 py-1 rounded-full shadow hover:scale-105 transition ${
                  beitragVerfuegbar
                    ? "bg-indigo-600 text-white"
                    : "bg-white border-2 border-gray-300 text-gray-400 cursor-not-allowed"
                }`}
                style={beitragVerfuegbar ? {} : { pointerEvents: "none", opacity: 0.5 }}
                aria-disabled={!beitragVerfuegbar}
                tabIndex={beitragVerfuegbar ? 0 : -1}
                title={beitragVerfuegbar ? "Zum Beitrag" : "Demnächst verfügbar"}
              >
                Zum Beitrag
              </a>
            </div>
            {/* Accessibility / KI-Analyse */}
            {(accessibilityStatus || typeof barrierescore === "number") && (
              <div className="flex gap-2 items-center text-xs mb-1" aria-label="Barrierefreiheit">
                {accessibilityStatus && (
                  <span className="rounded bg-green-50 text-green-700 px-2 py-1 font-bold">
                    Accessibility: {accessibilityStatus}
                  </span>
                )}
                {typeof barrierescore === "number" && (
                  <span>
                    Barrierefreiheits-Score: {barrierescore}/100
                  </span>
                )}
              </div>
            )}
            {hasAI && (
              <div className="text-xs text-gray-500 mt-1" aria-label="KI-Analyse">
                {ai.toxicity != null && <>Toxizität: {(ai.toxicity * 100).toFixed(2)} % </>}
                {ai.sentiment != null && <>Stimmung: {ai.sentiment} </>}
                {Array.isArray(ai.subjectAreas) && ai.subjectAreas.length > 0 && (
                  <>Themen: {ai.subjectAreas.join(", ")}</>
                )}
              </div>
            )}
            <div className="text-xs text-gray-400 text-right mt-1">
              {region} · {topic} · <span className="uppercase">{language}</span>
              <br />
              {viewers} Beteiligte
              {date && (
                <span className="block text-[10px] text-gray-300">
                  {new Date(date).toLocaleDateString("de-DE")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* MODAL */}
      {modalOpen && (
        <StreamModal
          id={id}
          title={titleToShow}
          status={status}
          region={region}
          topic={topic}
          language={language}
          viewers={viewers}
          trailerUrl={trailerUrl}
          image={image}
          description={description}
          statements={statements}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
