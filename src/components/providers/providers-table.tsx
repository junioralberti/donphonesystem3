
"use client";

import type { Provider } from "@/lib/schemas/provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, TruckIcon, Loader2 } from "lucide-react";
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

interface ProvidersTableProps {
  providers: Provider[];
  onEdit: (provider: Provider) => void;
  onDelete: (providerId: string) => Promise<void>;
  isLoadingDeleteForId?: string | null;
}

export function ProvidersTable({ providers, onEdit, onDelete, isLoadingDeleteForId }: ProvidersTableProps) {
  if (!providers || providers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <TruckIcon className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Nenhum fornecedor encontrado</h3>
        <p className="text-muted-foreground">Adicione um novo fornecedor para começar.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Contato</TableHead>
            <TableHead className="hidden sm:table-cell">E-mail</TableHead>
            <TableHead className="hidden md:table-cell">Telefone</TableHead>
            <TableHead className="hidden lg:table-cell">Cadastrado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell className="font-medium">{provider.name}</TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{provider.contactPerson || "-"}</TableCell>
              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{provider.email || "-"}</TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{provider.phone || "-"}</TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {provider.createdAt instanceof Date ? format(provider.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
              </TableCell>
              <TableCell className="text-right space-x-1 sm:space-x-2">
                <Button variant="outline" size="icon" onClick={() => onEdit(provider)} aria-label="Editar fornecedor" disabled={!provider.id}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" disabled={isLoadingDeleteForId === provider.id || !provider.id} aria-label="Excluir fornecedor">
                      {isLoadingDeleteForId === provider.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o fornecedor "{provider.name}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
<<<<<<< HEAD
                      <AlertDialogAction onClick={async () => provider.id && (await onDelete(provider.id))}>
=======
                      <AlertDialogAction onClick={async () => provider.id && await onDelete(provider.id)}>
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
      </Table>
    </div>
  );
}
