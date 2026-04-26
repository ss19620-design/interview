import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const researchProjects = sqliteTable("ResearchProject", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description").notNull(),
  introScript: text("introScript").notNull(),
  consentText: text("consentText").notNull(),
  closingScript: text("closingScript").notNull(),
  maxFollowUps: integer("maxFollowUps").notNull().default(1),
  createdAt: text("createdAt").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const interviewQuestions = sqliteTable("InterviewQuestion", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("projectId").notNull().references(() => researchProjects.id, { onDelete: "cascade" }),
  orderIndex: integer("orderIndex").notNull(),
  text: text("text").notNull(),
}, (t) => [
  uniqueIndex("InterviewQuestion_projectId_orderIndex_key").on(t.projectId, t.orderIndex),
  index("InterviewQuestion_projectId_idx").on(t.projectId),
]);

export const interviewSessions = sqliteTable("InterviewSession", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("projectId").notNull().references(() => researchProjects.id, { onDelete: "cascade" }),
  publicToken: text("publicToken").notNull().unique(),
  consented: integer("consented", { mode: "boolean" }).notNull().default(false),
  consentedAt: text("consentedAt"),
  startedAt: text("startedAt"),
  completedAt: text("completedAt"),
}, (t) => [
  index("InterviewSession_projectId_idx").on(t.projectId),
]);

export const interviewResponses = sqliteTable("InterviewResponse", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  sessionId: text("sessionId").notNull().references(() => interviewSessions.id, { onDelete: "cascade" }),
  questionId: text("questionId").references(() => interviewQuestions.id, { onDelete: "set null" }),
  questionText: text("questionText").notNull(),
  transcript: text("transcript").notNull(),
  followUpCount: integer("followUpCount").notNull().default(0),
  createdAt: text("createdAt").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (t) => [
  index("InterviewResponse_sessionId_idx").on(t.sessionId),
  index("InterviewResponse_questionId_idx").on(t.questionId),
]);

// Simple CUID-like ID generator using Web Crypto API
function createId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const ts = Date.now().toString(36);
  const rand = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
  return `c${ts}${rand}`;
}
