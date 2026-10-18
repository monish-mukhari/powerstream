"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { courseArtwork } from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/status-badge";

type Course = { id: string; title: string; description: string; createdAt: string };
type Video = { id: string; courseId: string; title: string; position: number; status: "UPLOADED" | "PROCESSING" | "READY" | "FAILED"; errorMessage: string | null; createdAt: string; course: { title: string } };
type DashboardProps = { initialCourses: Course[]; initialVideos: Video[]; maxUploadSizeMb: number };
type UploadProgress = { label: string; percent: number };
type View = "videos" | "courses" | "upload" | "new-course";

async function uploadDirectly(url: string, file: File, onProgress: (percent: number) => void) {
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", file.type);
    request.upload.onprogress = (event) => event.lengthComputable && onProgress(Math.round((event.loaded / event.total) * 100));
    request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(`Object storage returned ${request.status}.`));
    request.onerror = () => reject(new Error("The upload was interrupted."));
    request.send(file);
  });
}

export function AdminDashboard({ initialCourses, initialVideos, maxUploadSizeMb }: DashboardProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("videos");
  const [courses, setCourses] = useState(initialCourses);
  const [videos, setVideos] = useState(initialVideos);
  const [courseBusy, setCourseBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const refreshVideos = useCallback(async () => {
    const response = await fetch("/api/admin/videos", { cache: "no-store" });
    if (response.ok) setVideos(((await response.json()) as { videos: Video[] }).videos);
  }, []);
  const hasActiveJobs = useMemo(() => videos.some((video) => video.status === "UPLOADED" || video.status === "PROCESSING"), [videos]);
  useEffect(() => {
    if (!hasActiveJobs) return;
    const timer = window.setInterval(refreshVideos, 2_500);
    return () => window.clearInterval(timer);
  }, [hasActiveJobs, refreshVideos]);

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCourseBusy(true); setMessage(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/admin/courses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: data.get("title"), description: data.get("description") }) });
    const body = (await response.json()) as { course?: Course; error?: string };
    setCourseBusy(false);
    if (!response.ok || !body.course) { setMessage({ type: "error", text: body.error ?? "Could not create course." }); return; }
    setCourses((current) => [body.course!, ...current]);
    setMessage({ type: "success", text: "Course created." });
    form.reset();
    setView("courses");
  }

  async function addVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || !file.size) { setMessage({ type: "error", text: "Choose a video file." }); return; }
    const metadata = { courseId: String(data.get("courseId")), title: String(data.get("title")), position: Number(data.get("position")), fileName: file.name, fileType: file.type, fileSize: file.size };
    setUploadBusy(true);
    try {
      setUploadProgress({ label: "Preparing secure upload", percent: 2 });
      const presignResponse = await fetch("/api/admin/videos/presign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(metadata) });
      const presign = (await presignResponse.json()) as { videoId?: string; rawKey?: string; uploadUrl?: string; error?: string };
      if (!presignResponse.ok || !presign.videoId || !presign.rawKey || !presign.uploadUrl) throw new Error(presign.error ?? "Could not prepare upload.");
      setUploadProgress({ label: "Uploading directly to storage…", percent: 5 });
      await uploadDirectly(presign.uploadUrl, file, (percent) => setUploadProgress({ label: "Uploading directly to storage…", percent }));
      setUploadProgress({ label: "Queueing encoding job…", percent: 100 });
      const completeResponse = await fetch(`/api/admin/videos/${presign.videoId}/complete`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ courseId: metadata.courseId, title: metadata.title, position: metadata.position, rawKey: presign.rawKey }) });
      const complete = (await completeResponse.json()) as { error?: string };
      if (!completeResponse.ok) throw new Error(complete.error ?? "Could not queue encoding.");
      await refreshVideos(); form.reset(); setFileName(""); setMessage({ type: "success", text: "Uploaded. Encoding has started." });
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Upload failed." }); }
    finally { setUploadBusy(false); setUploadProgress(null); }
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }
  const countForCourse = (id: string) => videos.filter((video) => video.courseId === id).length;
  const navButton = (target: "videos" | "courses", label: string) => <button type="button" onClick={() => { setView(target); setMessage(null); }} className={`text-sm transition ${view === target || (target === "courses" && view === "new-course") || (target === "videos" && view === "upload") ? "text-[#e11d48]" : "text-[#4b4b55] hover:text-[#111113]"}`}>{label}</button>;

  return (
    <main className="page-shell">
      <header className="border-b border-[#e8e8ec] bg-white">
        <div className="content-width flex h-16 items-center">
          <Brand admin />
          <nav className="ml-auto flex items-center gap-7">{navButton("videos", "Videos")}{navButton("courses", "Courses")}<button type="button" onClick={logout} className="text-sm text-[#4b4b55] hover:text-[#111113]">Logout</button></nav>
        </div>
      </header>

      <div className="content-width flex-1 py-12 md:py-16">
        {message ? <div className={`mb-7 rounded-lg border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{message.text}</div> : null}

        {view === "videos" ? (
          <section>
            <div className="mb-10 flex items-center justify-between"><h1 className="text-[28px] font-semibold tracking-[-0.025em]">Videos</h1><Button onClick={() => setView("upload")}>↥&nbsp; Upload video</Button></div>
            <div className="overflow-hidden rounded-xl border border-[#e8e8ec]">
              <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#fafafa] text-xs"><tr><th className="px-5 py-4 font-medium">Title</th><th className="px-5 py-4 font-medium">Course</th><th className="px-5 py-4 font-medium">Status</th><th className="px-5 py-4 font-medium">Created</th><th className="w-12" /></tr></thead><tbody className="divide-y divide-[#e8e8ec]">{videos.map((video) => <tr key={video.id}><td className="px-5 py-5 font-medium">{video.title}</td><td className="px-5 py-5 text-[#6b6b76]">{video.course.title}</td><td className="px-5 py-5"><StatusBadge status={video.status} /></td><td className="px-5 py-5 text-[#6b6b76]">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(video.createdAt))}</td><td className="px-5 text-[#6b6b76]">⋮</td></tr>)}{videos.length === 0 ? <tr><td colSpan={5} className="px-6 py-20 text-center"><div className="mx-auto mb-4 grid size-10 place-items-center rounded-full bg-[#fff1f3] text-[#e11d48]">■</div><p className="font-medium">No videos yet</p><p className="mt-2 text-xs text-[#6b6b76]">Upload your first video to start building your courses.</p><Button className="mt-5" onClick={() => setView("upload")}>Upload your first video</Button></td></tr> : null}</tbody></table></div>
            </div>
          </section>
        ) : null}

        {view === "courses" ? (
          <section>
            <div className="mb-10 flex items-center justify-between"><h1 className="text-[28px] font-semibold tracking-[-0.025em]">Courses</h1><Button onClick={() => setView("new-course")}>＋ New course</Button></div>
            <div className="overflow-hidden rounded-xl border border-[#e8e8ec]">
              <div className="grid grid-cols-[1fr_110px_50px] bg-[#fafafa] px-5 py-4 text-xs font-medium"><span>Course</span><span>Videos</span><span /></div>
              {courses.map((course, index) => <div key={course.id} className="grid grid-cols-[1fr_110px_50px] items-center border-t border-[#e8e8ec] px-5 py-3"><div className="flex items-center gap-4"><img src={courseArtwork[index % courseArtwork.length]} alt="" className="h-12 w-[72px] rounded object-cover" /><span className="font-medium">{course.title}</span></div><span className="text-sm text-[#6b6b76]">{countForCourse(course.id)} videos</span><button type="button" className="text-xs text-[#e11d48]">Edit</button></div>)}
              {courses.length === 0 ? <div className="border-t border-[#e8e8ec] px-6 py-20 text-center"><p className="font-medium">No courses yet</p><p className="mt-2 text-sm text-[#6b6b76]">Get started by creating your first course.</p><Button className="mt-5" onClick={() => setView("new-course")}>New course</Button></div> : null}
            </div>
          </section>
        ) : null}

        {view === "new-course" ? (
          <section className="mx-auto max-w-[620px]"><h1 className="text-[28px] font-semibold tracking-[-0.025em]">New Course</h1><p className="mt-2 text-sm text-[#6b6b76]">Create a course to organize your videos.</p><form onSubmit={createCourse} className="mt-10 space-y-6"><div><Label htmlFor="course-title">Course Title</Label><Input id="course-title" name="title" placeholder="e.g. Intro to System Design" required /></div><div><Label htmlFor="course-description">Description</Label><Textarea id="course-description" name="description" placeholder="What will students learn?" required /></div><div className="flex gap-3 border-t border-[#e8e8ec] pt-8"><Button disabled={courseBusy}>{courseBusy ? "Creating…" : "Create course"}</Button><Button type="button" variant="ghost" onClick={() => setView("courses")}>Cancel</Button></div></form></section>
        ) : null}

        {view === "upload" ? (
          <section className="mx-auto max-w-[620px]"><h1 className="text-[28px] font-semibold tracking-[-0.025em]">Upload Video</h1><p className="mt-2 text-sm text-[#6b6b76]">Add a new lesson to one of your courses.</p><form onSubmit={addVideo} className="mt-10 space-y-6"><div><Label htmlFor="course">Course</Label><div className="flex items-center gap-4"><Select id="course" name="courseId" required defaultValue=""><option value="" disabled>Select a course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select><button type="button" onClick={() => setView("new-course")} className="shrink-0 text-xs font-medium text-[#e11d48]">＋ New course</button></div></div><div><Label htmlFor="video-title">Video Title</Label><Input id="video-title" name="title" placeholder="e.g. 1. What is System Design?" required /></div><Input id="position" name="position" type="hidden" value={videos.length + 1} readOnly /><div><Label htmlFor="video-file">Video File</Label><label htmlFor="video-file" className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#d5d5dc] bg-[#fafafa] text-center transition hover:border-[#e11d48]"><span className="text-2xl text-[#6b6b76]">☁</span><span className="mt-3 text-sm font-medium">Drag a video here or <span className="text-[#e11d48]">browse</span></span><span className="mt-1 text-xs text-[#6b6b76]">MP4, MOV supported (Max {maxUploadSizeMb}MB)</span></label><input id="video-file" name="file" type="file" accept="video/mp4,video/quicktime,video/webm" required className="sr-only" onChange={(event: ChangeEvent<HTMLInputElement>) => setFileName(event.target.files?.[0]?.name ?? "")} />{fileName ? <div className="mt-4 flex items-center justify-between rounded-lg border border-rose-200 bg-[#fff1f3] px-4 py-3 text-sm"><span>▣ &nbsp; {fileName}</span><button type="button" onClick={() => { setFileName(""); const input = document.getElementById("video-file") as HTMLInputElement | null; if (input) input.value = ""; }} className="text-xs font-semibold text-[#e11d48]">Remove</button></div> : null}</div>{uploadProgress ? <div className="rounded-lg border border-[#e8e8ec] bg-[#fafafa] p-4"><div className="mb-3 flex justify-between text-xs"><span>{uploadProgress.label}</span><span className="text-[#e11d48]">{uploadProgress.percent}%</span></div><div className="h-1 bg-[#e8e8ec]"><div className="h-full bg-[#e11d48] transition-all" style={{ width: `${uploadProgress.percent}%` }} /></div></div> : null}<div className="flex gap-3 border-t border-[#e8e8ec] pt-8"><Button disabled={uploadBusy || courses.length === 0}>{uploadBusy ? "Uploading…" : "Upload"}</Button><Button type="button" variant="ghost" onClick={() => setView("videos")}>Cancel</Button></div></form></section>
        ) : null}
      </div>
    </main>
  );
}
