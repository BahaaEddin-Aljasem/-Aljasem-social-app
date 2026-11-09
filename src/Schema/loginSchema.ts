import { z } from "zod";

export const LoginSchema = z.object({
  login: z.string().trim().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;