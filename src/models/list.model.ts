import { z } from 'zod';

export const listSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(3).max(255),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

export const listUpdateSchema = listSchema.pick({
  name: true,
})

export type List = z.infer<typeof listSchema>
export type ListUpdate = z.infer<typeof listUpdateSchema>