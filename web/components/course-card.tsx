import Link from "next/link";

type CourseCardProps = {
  id: string;
  title: string;
  description: string;
  lessonCount: number;
  index: number;
};

export const courseArtwork = [
  "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_eec2ac3039_48799c06b379f062.png",
  "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_8e9dfa8601_11d188fb8e0e8150.png",
  "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_45d24ed874_28cc1a7b3026aa34.png",
  "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_35f10b0b8d_a47bf0a5f135b7ab.png",
  "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_41a0a8299c_9589183f93d330d2.png",
  "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_30f7608a1c_eb27f74e0ae1acc9.png",
];

export function CourseCard({ id, title, lessonCount, index }: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`} className="group flex flex-col overflow-hidden rounded-xl border border-[#e8e8ec] bg-[#fafafa] no-underline transition-colors hover:border-[#e11d48] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e11d48]">
      <div className="aspect-video w-full overflow-hidden bg-[#e8e8ec]">
        <img src={courseArtwork[index % courseArtwork.length]} alt="" className="size-full object-cover transition duration-300 group-hover:scale-[1.015]" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-base font-medium tracking-[-0.01em] text-[#111113]">{title}</h2>
        <p className="mt-1 text-[13px] text-[#6b6b76]">{lessonCount} {lessonCount === 1 ? "video" : "videos"}</p>
      </div>
    </Link>
  );
}
