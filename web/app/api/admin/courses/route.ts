import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const courses = await prisma.course.findMany({
    include: { videos: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { title?: string; description?: string } | null;
  const title = body?.title?.trim();
  const description = body?.description?.trim();

  if (!title || title.length > 120) {
    return NextResponse.json({ error: "Course title must be 1–120 characters." }, { status: 400 });
  }
  if (!description || description.length > 1_000) {
    return NextResponse.json({ error: "Description must be 1–1000 characters." }, { status: 400 });
  }

  const course = await prisma.course.create({ data: { title, description } });
  return NextResponse.json({ course }, { status: 201 });
}
