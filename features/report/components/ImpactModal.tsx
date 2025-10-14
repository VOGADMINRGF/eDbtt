// features/report/components/ImpactModal.tsx
export default function ImpactModal({ statement, onClose }) {
    // Demo: später API für echte Impacts/Alternativen
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
          <button className="absolute top-2 right-4 text-lg" onClick={onClose}>×</button>
          <div className="text-lg font-bold mb-4">{statement.title}</div>
          {/* Impacts/Alternativen */}
          <div className="mb-4">
            <div className="font-semibold text-sm mb-2">Impacts & Alternativen</div>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              {statement.impacts?.map((imp, i) =>
                <li key={i}><b>{imp.type}:</b> {imp.description}</li>
              ) || <li className="text-neutral-400">Noch keine Impacts hinterlegt.</li>}
            </ul>
          </div>
          <button className="bg-indigo-600 text-white rounded px-4 py-2"
            disabled>Impact ergänzen (Demo)</button>
        </div>
      </div>
    );
  }
  