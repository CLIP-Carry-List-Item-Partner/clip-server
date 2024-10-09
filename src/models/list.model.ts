import { z } from 'zod';

export const listSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(3).max(255),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  userId: z.number().int().positive(),
})

export const listUpdateSchema = listSchema.pick({
  id: true,
  name: true,
  userId: true,
}).extend({
  item: z.object({
    id: z.string(),
    name: z.string().min(3).max(255),
    createdAt: z.string().transform((val) => new Date(val)),
    updatedAt: z.string().transform((val) => new Date(val)),
  })
})

export type List = z.infer<typeof listSchema>
export type ListUpdate = z.infer<typeof listUpdateSchema>