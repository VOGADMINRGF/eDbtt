export default function VoicesList({ voices }) {
    if (!voices?.length) return null;
    return (
      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
        <div className="font-bold text-sm mb-1">Stimmen aus Gesellschaft & Medien:</div>
        {voices.map((v, i) => (
          <div key={v.name + i} className="mb-2 text-xs">
            <span className="font-bold">{v.type}:</span> <span className="font-semibold">{v.name}</span>
            <span className="ml-1 text-neutral-700">„{v.quote}“</span>
            {v.url && <a href={v.url} className="underline text-coral ml-2" target="_blank" rel="noopener noreferrer">Quelle</a>}
          </div>
        ))}
      </div>
    );
  }
  