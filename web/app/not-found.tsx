import Link from "next/link";
import { Brand } from "@/components/brand";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-white p-6">
      <section className="w-full max-w-[700px] rounded-xl border border-[#e8e8ec] bg-[#fafafa] px-6 py-20 text-center">
        <div className="mb-10 flex justify-center"><Brand /></div>
        <p className="text-5xl font-semibold text-[#ffe4e9]">404</p>
        <h1 className="mt-2 text-lg font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-[#6b6b76]">The page you’re looking for doesn’t exist or has been moved.</p>
        <Link href="/" className="mt-6 inline-flex text-sm font-medium text-[#e11d48] no-underline hover:text-[#be123c]">← Back to courses</Link>
      </section>
    </main>
  );
}
