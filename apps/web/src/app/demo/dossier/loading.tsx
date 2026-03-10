import { DEMO_CARD } from "@/lib/ui/demoUi";

export default function DemoDossierLoading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-12">
      <div className={`${DEMO_CARD} w-full p-6 space-y-3`}>
        <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-6 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
