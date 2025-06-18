
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().optional(), // Firestore ID
  name: z.string().min(2, { message: "O nome do produto deve ter pelo menos 2 caracteres." }),
  sku: z.string().min(1, { message: "SKU é obrigatório." }),
  price: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val),
    z.number({ invalid_type_error: "Preço deve ser um número." }).positive({ message: "O preço deve ser positivo." })
  ),
  stock: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ invalid_type_error: "Estoque deve ser um número." }).int().nonnegative({ message: "O estoque não pode ser negativo." })
  ),
  imageUrl: z.string().url({ message: "URL da imagem inválida." }).optional().or(z.literal('')),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type Product = z.infer<typeof ProductSchema>;
