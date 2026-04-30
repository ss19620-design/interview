# InterviewBot (MVP)

AI-powered voice interview collection tool.

## Features

- Researcher dashboard: create projects, manage questions, generate session links
- Public interview flow: consent → intro → question-by-question voice recording (or typed fallback)
- Transcripts stored in SQLite via Prisma
- Export transcripts per session: TXT / CSV / JSON
- Optional neutral follow-up when an answer is too short (max configurable per project)

## Tech stack (local-only)

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM + SQLite file DB
- Gemini API (`GEMINI_API_KEY`)

## Prerequisites (software to install)

- Node.js 18+ (you can use the latest LTS)
- npm (comes with Node)

## Setup

1) Install dependencies:

```bash
npm install
```

2) Create a `.env.local` from `.env.example` (Gemini is optional but recommended):

```bash
copy .env.example .env.local
```

Then set:

- `GEMINI_API_KEY`: your Gemini API key

Note: `DATABASE_URL` is already set in `.env` to `file:./dev.db`.

3) Create the database and generate Prisma client:

```bash
npx prisma migrate dev
```

4) Run the app:

```bash
npm run dev
```

Open `https://interviewbot.interviewbot.workers.dev/`.

## Usage

- Go to `/projects` to create a project and questions.
- Open a project and click **Generate public session link**.
- Share `/session/[token]` with interviewees.
- View transcripts inside the project page and download exports.

## Exports

- `GET /api/export/session/[id].txt`
- `GET /api/export/session/[id].csv`
- `GET /api/export/session/[id].json`

