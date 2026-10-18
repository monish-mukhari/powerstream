import { AdminDashboard } from "@/components/admin/dashboard";
import { requireAdminPage } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminPage();
  const [courses, videos] = await Promise.all([
    prisma.course.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.video.findMany({ include: { course: { select: { title: true } } }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <AdminDashboard
      initialCourses={courses.map((course) => ({ ...course, createdAt: course.createdAt.toISOString() }))}
      initialVideos={videos.map((video) => ({ ...video, createdAt: video.createdAt.toISOString() }))}
      maxUploadSizeMb={Math.floor(env.maxUploadBytes / 1024 / 1024)}
    />
  );
}
