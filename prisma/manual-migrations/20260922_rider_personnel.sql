-- Prepare only. Apply after explicit approval and a verified database backup.
CREATE TABLE "RiderPersonnelProfile" (
  "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL UNIQUE,
  "matricule" TEXT UNIQUE, "data" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1, "updatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RiderPersonnelProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "RiderPersonnelDocument" (
  "id" TEXT PRIMARY KEY, "profileId" TEXT NOT NULL, "kind" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL, "content" BYTEA NOT NULL, "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RiderPersonnelDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "RiderPersonnelProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "RiderPersonnelDocument_profileId_kind_createdAt_idx" ON "RiderPersonnelDocument"("profileId", "kind", "createdAt");
