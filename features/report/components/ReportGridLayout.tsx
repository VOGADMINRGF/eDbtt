import ReportList from "./ReportList";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";

export default function ReportGridLayout() {
  return (
    <div className="flex gap-6 max-w-7xl mx-auto px-4 py-10">
      {/* Links: Themen/Trends (nur Desktop/Tablet sichtbar) */}
      <aside className="hidden lg:block w-1/5"><LeftSidebar /></aside>
      {/* Mitte: ReportCards/Content */}
      <main className="flex-1 min-w-0"><ReportList /></main>
      {/* Rechts: News, Community, Info (nur Desktop/Tablet sichtbar) */}
      <aside className="hidden xl:block w-1/4"><RightSidebar /></aside>
    </div>
  );
}
