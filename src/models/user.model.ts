// import { z } from 'zod';

// // Perbarui tipe id menjadi string
// export const userSchema = z.object({
//   id: z.number(), // id dari Google berupa string
//   name: z.string({ required_error: 'Name is required' }).min(3).max(100),
//   email: z.string({ required_error: 'Email is required' }).email(),
// });

// export const userUpdateSchema = userSchema.pick({
//   name: true,
// });

// export type User = z.infer<typeof userSchema>;
// export type userUpdate = z.infer<typeof userUpdateSchema>;