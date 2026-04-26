"use client";

import { useState } from "react";

export function CreateSessionButton(props: { projectId: string }) {
  const [creating, setCreating] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setCreating(true);
    setError(null);
    setLink(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: props.projectId }),
      });
      const json = (await res.json()) as {
        session?: { id: string; publicToken: string };
        error?: string;
      };
      if (!res.ok || !json.session) throw new Error(json.error || "Failed to create session");
      const url = `${window.location.origin}/session/${json.session.publicToken}`;
      setLink(url);
      await navigator.clipboard.writeText(url).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create session");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        disabled={creating}
        onClick={() => void create()}
        className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
      >
        {creating ? "Generating…" : "Generate public session link"}
      </button>
      {link ? (
        <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4 text-sm shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Copied link</div>
          <a className="mt-2 block break-all font-medium text-foreground underline underline-offset-4" href={link}>
            {link}
          </a>
          <div className="mt-2 text-xs text-muted-foreground">Share this link with your interviewees.</div>
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
