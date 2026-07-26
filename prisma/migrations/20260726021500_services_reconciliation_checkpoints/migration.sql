CREATE TABLE IF NOT EXISTS "ServicesReconciliationCheckpoint" (
  "scope" TEXT NOT NULL,
  "cursorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServicesReconciliationCheckpoint_pkey" PRIMARY KEY ("scope")
);
