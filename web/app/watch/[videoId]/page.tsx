import Link from "next/link";
import { notFound } from "next/navigation";
import { courseArtwork } from "@/components/course-card";
import { HlsPlayer } from "@/components/player/hls-player";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ videoId: string }> };

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: PageProps) {
  const { videoId } = await params;
  const video = await prisma.video.findFirst({
    where: { id: videoId, status: "READY", hlsPath: { not: null } },
    include: { course: { include: { videos: { where: { status: "READY" }, orderBy: { position: "asc" } } } } },
  });
  if (!video?.hlsPath) notFound();
  const playbackUrl = `${env.cdnBaseUrl}/${video.hlsPath}`;

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-width py-10 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            <HlsPlayer playbackUrl={playbackUrl} title={video.title} />
            <h1 className="mt-6 text-xl font-semibold tracking-[-0.02em]">{video.position}. {video.title}</h1>
            <Link href={`/courses/${video.courseId}`} className="mt-2 inline-flex text-sm text-[#6b6b76] no-underline hover:text-[#e11d48]">{video.course.title}</Link>
          </div>
          <aside>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em]">Up next</p>
            <div className="space-y-2">
              {video.course.videos.map((item) => {
                const active = item.id === video.id;
                return (
                  <Link key={item.id} href={`/watch/${item.id}`} aria-current={active ? "page" : undefined} className={`flex gap-3 rounded-lg border p-2 no-underline transition ${active ? "border-[#fecdd6] bg-[#fff1f3]" : "border-transparent hover:bg-[#fafafa]"}`}>
                    <div className="relative aspect-video w-[76px] shrink-0 overflow-hidden rounded border border-[#e8e8ec] bg-[#fafafa]">
                      <img src={courseArtwork[0]} alt="" className={`size-full object-cover ${active ? "opacity-60" : ""}`} />
                      {active ? <span className="absolute inset-0 grid place-items-center text-[#e11d48]">▶</span> : null}
                    </div>
                    <div className="min-w-0 py-0.5">
                      <p className="line-clamp-2 text-xs font-medium leading-5">{item.title}</p>
                      <p className={`mt-1 text-[10px] ${active ? "font-semibold uppercase tracking-wide text-[#e11d48]" : "text-[#6b6b76]"}`}>{active ? "Playing" : `Lesson ${item.position}`}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
