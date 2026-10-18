import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PowerStream", template: "%s - PowerStream" },
  description: "Minimal video courses for focused learning.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
