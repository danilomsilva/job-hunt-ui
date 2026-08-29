import { z } from 'zod';

/**
 * The credentials shape job-hunt-api validates on `/auth/register` and
 * `/auth/login` (see its `src/routes/auth.ts`): a valid email, and a password
 * of 8–72 characters — bcrypt silently truncates past 72 bytes, so the backend
 * caps it there.
 */
export const credentialsSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

export type Credentials = z.infer<typeof credentialsSchema>;
