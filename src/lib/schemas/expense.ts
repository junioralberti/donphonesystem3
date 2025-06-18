
import { z } from 'zod';

export const expenseCategories = [
  "Aluguel",
  "Internet",
  "Energia",
  "Água",
  "Compras", 
  "Salários", 
  "Impostos", 
  "Transporte", 
  "Serviços de Terceiros", 
  "Manutenção e Reparos", 
  "Material de Escritório",
  "Telefonia", 
  "Software e Assinaturas", 
  "Marketing e Publicidade",
  "Taxas Bancárias",
  "Outros", 
] as const;

export type ExpenseCategory = typeof expenseCategories[number];

export const ExpenseStatusSchema = z.enum(["Pendente", "Pago"]);
export type ExpenseStatus = z.infer<typeof ExpenseStatusSchema>;

export const ExpenseSchema = z.object({
  id: z.string().optional(), // Firestore ID
  title: z.string().min(2, { message: "O título da despesa deve ter pelo menos 2 caracteres." }),
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val),
    z.number({ invalid_type_error: "O valor deve ser um número." }).positive({ message: "O valor deve ser positivo." })
  ),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória.", invalid_type_error: "Data de vencimento inválida."}),
  category: z.enum(expenseCategories, { required_error: "A categoria é obrigatória." }),
  status: ExpenseStatusSchema.default("Pendente"),
  notes: z.string().optional().or(z.literal('')),
  paymentDate: z.date().optional().nullable(),
  createdAt: z.any().optional(), 
  updatedAt: z.any().optional(), 
});

export type Expense = z.infer<typeof ExpenseSchema>;

export const ExpenseFormSchema = ExpenseSchema.extend({
  dueDate: z.string().min(1, "A data de vencimento é obrigatória."),
  paymentDate: z.string().optional().nullable(),
});

export type ExpenseFormData = z.infer<typeof ExpenseFormSchema>;
