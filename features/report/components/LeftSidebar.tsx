export default function LeftSidebar() {
  return (
    <aside className="flex flex-col gap-8 pr-4 sticky top-8 text-sm max-w-[14rem]">
      <div>
        <h4 className="font-bold text-neutral-700 mb-2">Themen im Fokus</h4>
        <div className="flex flex-wrap gap-2">
          {["Arbeitsmarkt", "Grenzschutz", "Integration", "Zuwanderung", "EU-Politik", "Bildung", "Wohnraum", "Gesundheit"].map(topic =>
            <span key={topic} className="bg-neutral-100 px-2 py-1 rounded">{topic}</span>
          )}
        </div>
      </div>
      <div>
        <h4 className="font-bold text-neutral-700 mb-2">Shortcuts</h4>
        <ul>
          <li><a href="#" className="text-indigo-700 underline">Alle Reports</a></li>
        </ul>
      </div>
    </aside>
  );
}
