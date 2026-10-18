import Link from "next/link";

export function Brand({ admin = false }: { admin?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 no-underline text-[#111113]">
      <span className="size-2.5 rounded-full bg-[#e11d48]" aria-hidden />
      <span className="text-[15px] font-semibold tracking-[-0.02em]">PowerStream</span>
      {admin ? <span className="ml-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6b6b76]">Admin</span> : null}
    </Link>
  );
}
