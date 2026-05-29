import { prisma } from "@/lib/prisma";
import { hasSensitiveWarning } from "@/lib/privacy";
import type { CaseStatus, Priority } from "@/lib/types";

type CreateCaseInput = {
  bed: string;
  transcript: string;
  priority?: Priority | null;
  createdBy?: string | null;
};

type UpdateCaseInput = {
  bed?: string;
  transcript?: string;
  status?: CaseStatus;
  priority?: Priority | null;
  actor?: string | null;
};

export async function listCases(filters: { status?: CaseStatus; q?: string }) {
  return prisma.case.findMany({
    where: {
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.q
        ? {
            bed: {
              contains: filters.q
            }
          }
        : {})
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getCase(id: string) {
  return prisma.case.findFirst({
    where: {
      id,
      deletedAt: null
    },
    include: {
      auditLogs: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });
}

export async function createCase(input: CreateCaseInput) {
  const sensitiveWarning = hasSensitiveWarning(input.transcript);

  return prisma.$transaction(async (tx) => {
    const item = await tx.case.create({
      data: {
        bed: normalizeBed(input.bed),
        transcript: input.transcript.trim(),
        priority: input.priority ?? null,
        createdBy: input.createdBy ?? null,
        sensitiveWarning
      }
    });

    await tx.auditLog.create({
      data: {
        caseId: item.id,
        action: "CREATED",
        newValue: JSON.stringify({ bed: item.bed, status: item.status }),
        actor: input.createdBy ?? null
      }
    });

    return item;
  });
}

export async function updateCase(id: string, input: UpdateCaseInput) {
  const current = await getCase(id);
  if (!current) {
    return null;
  }

  const data = {
    ...(input.bed !== undefined ? { bed: normalizeBed(input.bed) } : {}),
    ...(input.transcript !== undefined
      ? {
          transcript: input.transcript.trim(),
          sensitiveWarning: hasSensitiveWarning(input.transcript)
        }
      : {}),
    ...(input.status !== undefined
      ? {
          status: input.status,
          closedAt:
            input.status === "RESOLVED" || input.status === "ARCHIVED"
              ? new Date()
              : null
        }
      : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {})
  };

  return prisma.$transaction(async (tx) => {
    const updated = await tx.case.update({
      where: { id },
      data
    });

    await tx.auditLog.create({
      data: {
        caseId: id,
        action: "UPDATED",
        oldValue: JSON.stringify({
          bed: current.bed,
          transcript: current.transcript,
          status: current.status,
          priority: current.priority
        }),
        newValue: JSON.stringify({
          bed: updated.bed,
          transcript: updated.transcript,
          status: updated.status,
          priority: updated.priority
        }),
        actor: input.actor ?? current.createdBy
      }
    });

    return updated;
  });
}

export async function softDeleteCase(id: string, actor?: string | null) {
  const current = await getCase(id);
  if (!current) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.case.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });

    await tx.auditLog.create({
      data: {
        caseId: id,
        action: "DELETED",
        oldValue: JSON.stringify({ bed: current.bed, status: current.status }),
        actor: actor ?? current.createdBy
      }
    });

    return deleted;
  });
}

function normalizeBed(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}
