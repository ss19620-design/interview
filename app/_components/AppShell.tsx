import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/app/_components/ThemeToggle";

export function AppShell(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="group flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border">
              <Image src="/logo.png" alt="InterviewBot" fill className="object-contain p-2" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight">InterviewBot</div>
              <div className="text-xs text-muted-foreground">{props.title}</div>
            </div>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              href="/projects"
            >
              Projects
            </Link>
            <Link
              className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              href="/"
            >
              Home
            </Link>
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{props.children}</main>
    </div>
  );
}
