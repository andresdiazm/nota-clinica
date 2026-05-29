export type CaseStatus = "PENDING" | "IN_REVIEW" | "RESOLVED" | "ARCHIVED";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type ClinicalCase = {
  id: string;
  bed: string;
  transcript: string;
  status: CaseStatus;
  priority: Priority | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  createdBy: string | null;
  sensitiveWarning: boolean;
  deletedAt: string | null;
};

export type AuditLog = {
  id: string;
  caseId: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  actor: string | null;
};

export type ClinicalCaseDetail = ClinicalCase & {
  auditLogs: AuditLog[];
};
