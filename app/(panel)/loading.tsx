// Panel sayfaları arasında geçişte anında gösterilen iskelet (menü yerinde kalır)
import { StatCardSkeleton, TableSkeleton } from "@/components/ui";

export default function PanelLoading() {
  return (
    <div aria-busy="true" aria-label="Yükleniyor">
      <div className="h-16 flex items-center px-4 sm:px-7" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="h-5 w-40 rounded-md animate-pulse" style={{ background: "var(--bg4)" }} />
      </div>
      <div className="p-4 sm:p-7 flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <TableSkeleton rows={6} cols={5} />
      </div>
    </div>
  );
}
