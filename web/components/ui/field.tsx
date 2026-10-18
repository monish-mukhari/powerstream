import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClass = "w-full rounded-lg border border-[#e8e8ec] bg-white px-3.5 text-sm text-[#111113] outline-none transition placeholder:text-[#aaaab3] focus:border-[#c9c9d0] focus:ring-2 focus:ring-[#e8e8ec]";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`${fieldClass} h-11 ${props.className ?? ""}`} />; }
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={`${fieldClass} h-11 cursor-pointer ${props.className ?? ""}`} />; }
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={`${fieldClass} min-h-24 resize-y py-3 ${props.className ?? ""}`} />; }
export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) { return <label htmlFor={htmlFor} className="mb-2 block text-xs font-medium text-[#6b6b76]">{children}</label>; }
