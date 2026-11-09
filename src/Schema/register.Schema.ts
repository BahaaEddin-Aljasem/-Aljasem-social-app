import { z } from "zod";
 
 
 export const RegisterSchema = z.object({
    Name: z
      .string()
      .nonempty("Full Name is required")
      .min(3, "Full Name must be at least 3 characters")
      .max(50, "Full Name must be at most 50 characters"),
    username: z
      .string()
      .trim()
      .max(50, "Username must be at most 50 characters")
      .refine((v) => v === "" || v.length >= 3, "Username must be at least 3 characters"),
    email: z
      .string()
      .nonempty("Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
        "Password must include uppercase, lowercase, number, and symbol",
      ),
    confirmPassword: z
      .string().nonempty("Confirm Password is required")
      .min(6, "Confirm Password must be at least 6 characters"),
    dateOfBirth: z.string().nonempty("Date of Birth is required").refine((val) => {
      const today = new Date();
      const birthDate = new Date(val);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 18;
    }, "You must be at least 18 years old"),
    gender: z.enum(["male", "female", "other"], "Gender is required"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof RegisterSchema>;