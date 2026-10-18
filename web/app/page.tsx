import { CourseCard } from "@/components/course-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const courses = await prisma.course.findMany({
    where: { videos: { some: { status: "READY" } } },
    include: { _count: { select: { videos: { where: { status: "READY" } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-width py-12 md:py-16">
        <header className="mb-12">
          <h1 className="text-[28px] font-semibold tracking-[-0.025em]">Courses</h1>
          <p className="mt-2 text-base text-[#6b6b76]">Browse our library of minimalist video courses.</p>
        </header>
        {courses.length ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => <CourseCard key={course.id} id={course.id} title={course.title} description={course.description} lessonCount={course._count.videos} index={index} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-[#e8e8ec] bg-[#fafafa] px-6 py-16 text-center">
            <div className="mx-auto mb-4 size-2.5 rounded-full bg-[#e11d48]" />
            <p className="font-medium">No courses available yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6b6b76]">The platform is currently being set up. Please check back later for new minimalist content.</p>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
