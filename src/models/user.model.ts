import { z } from 'zod';

export const userSchema = z.object({
  id: z.number(),
  name: z.string({ required_error: 'Name is required' }).min(3).max(100),
  email: z.string({ required_error: 'Email is required' }).email(),
});

export const userUpdateSchema = userSchema.pick ({
  name: true,
  // email: z.string({ required_error: 'Email is required' }).email(),
});

export const userLoginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email(),
})


export type User = z.infer<typeof userSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;