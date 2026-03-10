export default function LeftSidebar() {
  return (
    <aside className="flex flex-col gap-8 pr-4 sticky top-8 text-sm max-w-[14rem]">
      <div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Themen im Fokus</h4>
        <div className="flex flex-wrap gap-2">
          {["Arbeitsmarkt", "Grenzschutz", "Integration", "Zuwanderung", "EU-Politik", "Bildung", "Wohnraum", "Gesundheit"].map(topic =>
            <span key={topic} className="rounded bg-slate-50 px-2 py-1 text-slate-700 dark:bg-slate-900/50 dark:text-slate-200">{topic}</span>
          )}
        </div>
      </div>
      <div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Shortcuts</h4>
        <ul>
          <li><a href="#" className="text-sky-700 underline dark:text-sky-400">Alle Reports</a></li>
        </ul>
      </div>
    </aside>
  );
}
