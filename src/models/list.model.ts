import { z } from 'zod';

export const listSchema = z.object({
  // id: z.number().int().positive(),
  name: z.string().min(3).max(255),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  // userId: z.number().int().positive(),
})

export const listUpdateSchema = listSchema.pick({
  // userId: true,
  name: true,
})
.extend({
    items: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(3).max(255),
    })
  ).optional(),
});

export const deleteItemSchema = z.object({  
  listId: z.number().int().positive(),
  itemId: z.string(),
})

export type List = z.infer<typeof listSchema>
export type ListUpdate = z.infer<typeof listUpdateSchema>
export type DeleteItem = z.infer<typeof deleteItemSchema>