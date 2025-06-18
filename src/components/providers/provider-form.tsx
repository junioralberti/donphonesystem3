
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProviderSchema, type Provider } from "@/lib/schemas/provider";
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

interface ProviderFormProps {
  onSubmit: (data: Provider) => Promise<void>;
  defaultValues?: Partial<Provider>;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function ProviderForm({ onSubmit, defaultValues, isEditing = false, isLoading = false }: ProviderFormProps) {
  const form = useForm<Provider>({
    resolver: zodResolver(ProviderSchema),
    defaultValues: defaultValues || {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      cnpj: "",
      address: "",
    },
  });

  const handleFormSubmit = async (data: Provider) => {
    await onSubmit(data);
    if (!isEditing && !isLoading) {
      form.reset({ name: "", contactPerson: "", email: "", phone: "", cnpj: "", address: "" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Fornecedor</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Distribuidora Peças Brasil" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pessoa de Contato (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Carlos Silva" {...field} value={field.value || ''} />
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
                <Input type="email" placeholder="Ex: contato@pecasbrasil.com" {...field} value={field.value || ''} />
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
                <Input placeholder="Ex: (11) 98765-4321" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 00.000.000/0001-00" {...field} value={field.value || ''} />
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
                <Input placeholder="Ex: Rua das Peças, 123, São Paulo - SP" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Salvar Alterações" : "Adicionar Fornecedor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
