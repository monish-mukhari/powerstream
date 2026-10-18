import Link from "next/link";
import { notFound } from "next/navigation";
import { courseArtwork } from "@/components/course-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: PageProps) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: { videos: { where: { status: "READY" }, orderBy: { position: "asc" } } },
  });
  if (!course) notFound();

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-width py-12 md:py-16">
        <div className="max-w-[850px]">
          <h1 className="text-[28px] font-semibold tracking-[-0.025em]">{course.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#6b6b76]">{course.description}</p>
          <div className="mt-6 flex items-center gap-6">
            <span className="text-sm text-[#6b6b76]">{course.videos.length} {course.videos.length === 1 ? "video" : "videos"}</span>
            {course.videos[0] ? <Link href={`/watch/${course.videos[0].id}`} className="inline-flex h-10 items-center rounded-lg bg-[#e11d48] px-5 text-sm font-semibold text-white no-underline transition hover:bg-[#be123c]">Start watching</Link> : null}
          </div>

          <div className="mt-10 border-t border-[#e8e8ec]">
            {course.videos.map((video, index) => (
              <Link key={video.id} href={`/watch/${video.id}`} className="group grid grid-cols-[24px_92px_1fr_auto] items-center gap-4 border-b border-[#e8e8ec] py-4 no-underline transition hover:bg-[#fafafa] sm:grid-cols-[24px_108px_1fr_auto]">
                <span className="text-center text-xs text-[#6b6b76]">{index + 1}</span>
                <div className="aspect-video overflow-hidden rounded border border-[#e8e8ec] bg-[#fafafa]">
                  <img src={courseArtwork[0]} alt="" className="size-full object-cover" />
                </div>
                <span className="min-w-0 truncate text-sm font-medium">{video.title}</span>
                <span className="hidden text-xs text-[#6b6b76] sm:inline">Lesson {String(video.position).padStart(2, "0")}</span>
              </Link>
            ))}
            {course.videos.length === 0 ? <div className="py-16 text-center text-sm text-[#6b6b76]">This course has no ready videos yet.</div> : null}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
