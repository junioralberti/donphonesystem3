
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientSchema, type Client } from "@/lib/schemas/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import React from "react"; // Import React

interface ClientFormProps {
  onSubmit: (data: Client) => Promise<void>;
  defaultValues?: Partial<Client>;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function ClientForm({ onSubmit, defaultValues, isEditing = false, isLoading = false }: ClientFormProps) {
  const form = useForm<Client>({
    resolver: zodResolver(ClientSchema),
    defaultValues: defaultValues || {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const handleFormSubmit = async (data: Client) => {
    await onSubmit(data);
  };

  React.useEffect(() => {
    if (defaultValues) {
        // Reset form when defaultValues change.
        // This is useful if the parent component wants to clear the form after submission.
        form.reset(defaultValues);
    }
  }, [defaultValues, form]); // Changed dependency to 'form'


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail (Opcional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="(00) 00000-0000" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Rua, Número, Bairro, Cidade" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isEditing ? "Salvar Alterações" : "Adicionar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

