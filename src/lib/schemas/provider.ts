
import { z } from 'zod';

export const ProviderSchema = z.object({
  id: z.string().optional(), // Firestore ID
  name: z.string().min(2, { message: "O nome do fornecedor deve ter pelo menos 2 caracteres." }),
  contactPerson: z.string().optional().or(z.literal('')),
  email: z.string().email({ message: "E-mail inválido." }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  cnpj: z.string().optional().or(z.literal('')), // CNPJ adicionado
  address: z.string().optional().or(z.literal('')), // Endereço adicionado
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type Provider = z.infer<typeof ProviderSchema>;
