// apps/web/src/components/SupportCTA.tsx
import { VOG_SUPPORT_URL } from "@/config/links";
export default function SupportCTA() {
  return (
    <div className="text-center">
      <a
        href={VOG_SUPPORT_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-block bg-coral text-white px-6 py-3 rounded font-semibold hover:opacity-90 transition"
      >
        Jetzt unterstützen
      </a>
    </div>
  );
}
