-- CreateTable
CREATE TABLE "ResearchProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "introScript" TEXT NOT NULL,
    "consentText" TEXT NOT NULL,
    "closingScript" TEXT NOT NULL,
    "maxFollowUps" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InterviewQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "InterviewQuestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "consented" BOOLEAN NOT NULL DEFAULT false,
    "consentedAt" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "InterviewSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterviewResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT,
    "questionText" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterviewResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InterviewResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "InterviewQuestion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InterviewQuestion_projectId_idx" ON "InterviewQuestion"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewQuestion_projectId_orderIndex_key" ON "InterviewQuestion"("projectId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSession_publicToken_key" ON "InterviewSession"("publicToken");

-- CreateIndex
CREATE INDEX "InterviewSession_projectId_idx" ON "InterviewSession"("projectId");

-- CreateIndex
CREATE INDEX "InterviewResponse_sessionId_idx" ON "InterviewResponse"("sessionId");

-- CreateIndex
CREATE INDEX "InterviewResponse_questionId_idx" ON "InterviewResponse"("questionId");
