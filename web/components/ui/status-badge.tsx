export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    READY: "bg-emerald-100 text-emerald-700",
    PROCESSING: "bg-amber-100 text-amber-700",
    UPLOADED: "bg-slate-100 text-slate-600",
    FAILED: "bg-rose-100 text-rose-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${colors[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}
