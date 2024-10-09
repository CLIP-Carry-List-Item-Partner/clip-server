import { z } from 'zod';

export const userSchema = z.object({
  id: z.number().int().positive(),
  name: z.string({ required_error: 'Name is required' }).min(6).max(30),
  email: z.string({ required_error: 'Email is required' }),
})

export const userUpdateSchema = userSchema.pick({
  name:true,
})

export type User = z.infer<typeof userSchema>;
export type userUpdate = z.infer<typeof userUpdateSchema>;