
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExpenseFormSchema, type ExpenseFormData, expenseCategories, ExpenseStatusSchema, type ExpenseCategory, type ExpenseStatus } from "@/lib/schemas/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from "react";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  defaultValues?: Partial<ExpenseFormData>;
  isEditing?: boolean;
  isLoading?: boolean;
  onClose?: () => void;
}

export function ExpenseForm({ onSubmit, defaultValues, isEditing = false, isLoading = false, onClose }: ExpenseFormProps) {
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(ExpenseFormSchema),
    defaultValues: defaultValues || {
      title: "",
      amount: undefined, // Use undefined for number inputs to allow placeholder
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      category: undefined,
      status: "Pendente",
      notes: "",
      paymentDate: null,
    },
  });

  React.useEffect(() => {
    if (defaultValues) {
        const currentPaymentDate = defaultValues.paymentDate;
        const currentDueDate = defaultValues.dueDate;
        form.reset({
            ...defaultValues,
            // Ensure dates are strings for the form
            dueDate: currentDueDate ? (typeof currentDueDate === 'string' ? currentDueDate : format(currentDueDate instanceof Date ? currentDueDate : parseISO(String(currentDueDate)), 'yyyy-MM-dd')) : format(new Date(), 'yyyy-MM-dd'),
            paymentDate: currentPaymentDate ? (typeof currentPaymentDate === 'string' ? currentPaymentDate : format(currentPaymentDate instanceof Date ? currentPaymentDate : parseISO(String(currentPaymentDate)), 'yyyy-MM-dd')) : null,
        });
    }
  }, [defaultValues, form]);


  const handleFormSubmit = async (data: ExpenseFormData) => {
    await onSubmit(data);
    if (!isLoading && !isEditing) { // Reset only on successful add
      form.reset({
        title: "",
        amount: undefined,
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        category: undefined,
        status: "Pendente",
        notes: "",
        paymentDate: null,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da Despesa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Conta de Luz Março" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="Ex: 150,00" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value.replace(/[^0-9,.]/g, '').replace('.', ','))}
                    value={field.value === undefined ? '' : String(field.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel className="mb-1.5">Data de Vencimento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(parseISO(field.value), "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value as ExpenseCategory}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value as ExpenseStatus}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ExpenseStatusSchema.options.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.watch("status") === "Pago" && (
           <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel className="mb-1.5">Data de Pagamento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(parseISO(field.value), "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes adicionais sobre a despesa..." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2">
          {onClose && <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>}
          <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Salvar Alterações" : "Adicionar Despesa"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

