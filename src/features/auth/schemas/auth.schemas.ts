import { z } from "zod";

/* ============================================================
 * Login Schema
 * ============================================================ */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .toLowerCase()
    .trim(),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

/* Alias — જૂના નામ માટે */
export const loginFormSchema = loginSchema;

/* ============================================================
 * Register Schema
 * ============================================================ */
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters" })
      .max(64, { message: "Name must be at most 64 characters" })
      .regex(/^[a-zA-Z\s.'-]+$/, {
        message: "Name can only contain letters, spaces, and . ' -",
      })
      .trim(),
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Please enter a valid email address" })
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(72, { message: "Password must be at most 72 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, {
        message: "Password must contain at least one number",
      })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character",
      }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms & Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/* ============================================================
 * Forgot Password Schema
 * ============================================================ */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .toLowerCase()
    .trim(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/* ============================================================
 * Reset Password Schema
 * ============================================================ */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(72, { message: "Password must be at most 72 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, {
        message: "Password must contain at least one number",
      })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character",
      }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/* ============================================================
 * Magic Link Schema
 * ============================================================ */
export const magicLinkSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .toLowerCase()
    .trim(),
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;