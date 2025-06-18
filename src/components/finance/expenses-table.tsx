
"use client";

import type { Expense, ExpenseStatus, ExpenseCategory } from "@/lib/schemas/expense";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ListFilter, CalendarDays, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpensesTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => Promise<void>;
  onToggleStatus: (expenseId: string, currentStatus: ExpenseStatus, paymentDate?: Date) => Promise<void>;
  isLoading: boolean;
  isLoadingDeleteForId?: string | null;
  isLoadingToggleForId?: string | null;
}

export function ExpensesTable({ 
    expenses, 
    onEdit, 
    onDelete, 
    onToggleStatus,
    isLoading,
    isLoadingDeleteForId,
    isLoadingToggleForId 
}: ExpensesTableProps) {

  if (isLoading && (!expenses || expenses.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando despesas...</p>
      </div>
    );
  }
  
  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <ListFilter className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Nenhuma despesa encontrada</h3>
        <p className="text-muted-foreground">Nenhuma despesa corresponde aos filtros selecionados ou não há despesas cadastradas.</p>
      </div>
    );
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead className="text-right">Valor (R$)</TableHead>
            <TableHead className="hidden md:table-cell">Vencimento</TableHead>
            <TableHead className="hidden sm:table-cell">Categoria</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium max-w-[150px] truncate" title={expense.title}>{expense.title}</TableCell>
              <TableCell className="text-right">{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
              <TableCell className="hidden md:table-cell text-sm">
                {format(expense.dueDate, "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm">
                <Badge variant="outline" className="text-xs">{expense.category}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => expense.id && onToggleStatus(expense.id, expense.status, expense.status === "Pendente" ? new Date() : undefined)}
                  disabled={isLoadingToggleForId === expense.id}
                  className={`h-auto px-2 py-1 text-xs rounded-full font-medium
                    ${expense.status === 'Pago' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                >
                  {isLoadingToggleForId === expense.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                    expense.status === 'Pago' ? 
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : 
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                  )}
                  {expense.status}
                </Button>
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="outline" size="icon" onClick={() => onEdit(expense)} aria-label="Editar despesa" className="h-8 w-8" disabled={!expense.id}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" disabled={isLoadingDeleteForId === expense.id || !expense.id} aria-label="Excluir despesa" className="h-8 w-8">
                      {isLoadingDeleteForId === expense.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a despesa "{expense.title}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
<<<<<<< HEAD
                      <AlertDialogAction onClick={async () => expense.id && (await onDelete(expense.id))}>
=======
                      <AlertDialogAction onClick={async () => expense.id && await onDelete(expense.id)}>
>>>>>>> 5a9736e1bc95fd07c8314d399cb646a39cc3aa78
                        Excluir Permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
            <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-bold">{totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                <TableCell colSpan={4}></TableCell> 
            </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

