
import { z } from 'zod';

export const ClientSchema = z.object({
  id: z.string().optional(), // Firestore ID, will be added after creation/retrieval
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "E-mail inválido." }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  createdAt: z.any().optional(), // Can be Date or Firestore Timestamp
  updatedAt: z.any().optional(), // Can be Date or Firestore Timestamp
});

export type Client = z.infer<typeof ClientSchema>;
