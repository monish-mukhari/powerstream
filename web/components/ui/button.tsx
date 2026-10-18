import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" };

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-[#e11d48] text-white hover:bg-[#be123c] focus-visible:ring-[#e11d48]",
    secondary: "border border-[#e8e8ec] bg-white text-[#111113] hover:bg-[#fafafa] focus-visible:ring-[#a1a1aa]",
    ghost: "text-[#6b6b76] hover:bg-[#fafafa] hover:text-[#111113] focus-visible:ring-[#a1a1aa]",
    danger: "bg-[#fff1f3] text-[#be123c] hover:bg-[#ffe4e9] focus-visible:ring-[#e11d48]",
  };
  return <button className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props} />;
}
