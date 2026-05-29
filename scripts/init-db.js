const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Case" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "bed" TEXT NOT NULL,
      "transcript" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "priority" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      "closedAt" DATETIME,
      "createdBy" TEXT,
      "sensitiveWarning" BOOLEAN NOT NULL DEFAULT false,
      "deletedAt" DATETIME
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "caseId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "oldValue" TEXT,
      "newValue" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "actor" TEXT,
      CONSTRAINT "AuditLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Case_bed_idx" ON "Case"("bed")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Case_status_idx" ON "Case"("status")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Case_createdAt_idx" ON "Case"("createdAt")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_caseId_idx" ON "AuditLog"("caseId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("SQLite database is ready.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
