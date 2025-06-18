
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserSchema, type User, UserRoleSchema, CreateUserFormSchema, type CreateUserFormData } from "@/lib/schemas/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import type { z } from 'zod';


interface UserFormProps {
  onSubmit: (data: User | CreateUserFormData) => Promise<void>; // Data can be User or CreateUserFormData
  defaultValues?: Partial<User>;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function UserForm({ onSubmit, defaultValues, isEditing = false, isLoading = false }: UserFormProps) {
  const schemaToUse = isEditing ? UserSchema : CreateUserFormSchema;

  const form = useForm<User | CreateUserFormData>({ // Union type for form data
    resolver: zodResolver(schemaToUse as z.ZodType<User | CreateUserFormData, any, any>),
    defaultValues: defaultValues || {
      name: "",
      email: "",
      role: "user",
      password: "", // Will be validated by CreateUserFormSchema if !isEditing
      confirmPassword: "", // Will be validated by CreateUserFormSchema if !isEditing
    },
  });

  const handleFormSubmit = async (data: User | CreateUserFormData) => {
    await onSubmit(data);
    if (!isEditing && !isLoading) {
        form.reset({ name: "", email: "", role: "user", password: "", confirmPassword: "" });
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
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do usuário" {...field} />
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
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="usuario@exemplo.com" {...field} disabled={isEditing} />
              </FormControl>
              {isEditing && <FormDescription className="text-xs">O e-mail não pode ser alterado após o cadastro.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        
        {!isEditing && (
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Repita a senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value as UserRole} // Cast to UserRole
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {UserRoleSchema.options.map(roleValue => (
                    <SelectItem key={roleValue} value={roleValue}>
                      {roleValue === 'admin' ? 'Administrador' : 'Usuário Padrão'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Salvar Alterações" : "Cadastrar Usuário"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
