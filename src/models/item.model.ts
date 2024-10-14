import { z } from 'zod';

export const itemSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(255),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  listId: z.number().int().positive(),
})

export const itemUpdateSchema = itemSchema.pick({
  // id: true,
  name: true,
})

export type Item = z.infer<typeof itemSchema>
export type ItemUpdate = z.infer<typeof itemUpdateSchema>