import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/admin/login-form";
import { isAdmin } from "@/lib/auth";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center bg-white p-5">
      <section className="w-full max-w-[380px] rounded-xl border border-[#e8e8ec] bg-[#fafafa] p-9 shadow-sm">
        <div className="flex justify-center"><Brand admin /></div>
        <LoginForm />
        <p className="mt-9 text-center text-[11px] text-[#aaaab3]">Authorized access only.</p>
      </section>
    </main>
  );
}
