import { Brand } from "@/components/brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e8e8ec] bg-white/95 backdrop-blur">
      <div className="content-width flex h-16 items-center">
        <Brand />
      </div>
    </header>
  );
}
