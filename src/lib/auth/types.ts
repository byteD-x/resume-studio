import { z } from "zod";

export const authUserRecordSchema = z.object({
  id: z.string().trim().min(1),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  name: z.string().trim().min(1),
  passwordHash: z.string().trim().min(1),
  passwordSalt: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  lastLoginAt: z.string().trim().default(""),
});

export const authSessionRecordSchema = z.object({
  id: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  expiresAt: z.string().trim().min(1),
  remember: z.boolean().default(false),
});

export const authUserPublicSchema = authUserRecordSchema.pick({
  id: true,
  email: true,
  name: true,
  createdAt: true,
  lastLoginAt: true,
});

export type AuthUserRecord = z.infer<typeof authUserRecordSchema>;
export type AuthSessionRecord = z.infer<typeof authSessionRecordSchema>;
export type AuthUserPublic = z.infer<typeof authUserPublicSchema>;

export interface AuthActionState {
  fields?: Partial<Record<"name" | "email" | "password" | "confirmPassword", string>>;
  message?: string;
}

export const INITIAL_AUTH_ACTION_STATE: AuthActionState = {};
