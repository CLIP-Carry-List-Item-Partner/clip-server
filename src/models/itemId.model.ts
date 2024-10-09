import { z } from 'zod';

export const itemIdSchema = z.object({
  id: z.string(),
})

export type ItemId = z.infer<typeof itemIdSchema>;