-- CreateTable
CREATE TABLE "AgentConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKey" TEXT NOT NULL,
    "testAgentPhoneNumber" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "completedGoals" TEXT NOT NULL,
    "failedGoals" TEXT NOT NULL DEFAULT '[]',
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "error" TEXT,
    CONSTRAINT "TestResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConversationTurn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testResultId" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationTurn_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES "TestResult" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
