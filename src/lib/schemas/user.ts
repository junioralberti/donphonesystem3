
import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'user']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Base fields common to both User and CreateUserForm schemas
const baseUserFields = {
  id: z.string().optional(),
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "E-mail inválido." }),
  role: UserRoleSchema.default('user'),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
};

// Schema for editing users (passwords are optional)
export const UserSchema = z.object({
  ...baseUserFields,
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }).optional().or(z.literal('')), // Optional and can be empty string
  confirmPassword: z.string().optional().or(z.literal('')), // Optional and can be empty string
}).refine(data => {
  // If password is provided (not undefined, not empty), then confirmPassword must match.
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword;
  }
  // If password is not provided or is an empty string, no confirmation needed.
  return true;
}, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export type User = z.infer<typeof UserSchema>;

// Schema for creating users (passwords are required)
export const CreateUserFormSchema = z.object({
  ...baseUserFields,
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string().min(1, { message: "A confirmação de senha é obrigatória." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export type CreateUserFormData = z.infer<typeof CreateUserFormSchema>;
