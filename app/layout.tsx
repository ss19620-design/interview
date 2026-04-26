import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "InterviewBot",
  description: "Voice-first AI interview platform for researchers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("h-full", GeistSans.variable)}>
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
