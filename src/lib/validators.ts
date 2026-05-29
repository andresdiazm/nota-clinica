import { z } from "zod";

export const statusSchema = z.enum(["PENDING", "IN_REVIEW", "RESOLVED", "ARCHIVED"]);
export const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]).nullable().optional();

export const caseCreateSchema = z.object({
  bed: z.string().trim().min(1, "La cama es obligatoria").max(40),
  transcript: z.string().trim().min(1, "La transcripcion es obligatoria").max(1000),
  priority: prioritySchema,
  createdBy: z.string().trim().max(120).optional().nullable()
});

export const caseUpdateSchema = z.object({
  bed: z.string().trim().min(1).max(40).optional(),
  transcript: z.string().trim().min(1).max(1000).optional(),
  status: statusSchema.optional(),
  priority: prioritySchema,
  actor: z.string().trim().max(120).optional().nullable()
});

export type CaseCreateInput = z.infer<typeof caseCreateSchema>;
export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>;
