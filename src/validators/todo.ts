import { z } from "zod";

export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(["WORK", "PERSONAL", "HEALTH", "SHOPPING", "EDUCATION", "FINANCE", "TRAVEL", "OTHER"]).default("OTHER"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  dueDate: z.string().optional().nullable(),
});

export const updateTodoSchema = createTodoSchema.partial().extend({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  order: z.number().optional(),
});

export const updateOrderSchema = z.object({
  order: z.number(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
