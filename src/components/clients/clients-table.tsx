"use client";

import type { Client } from "@/lib/schemas/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, UserRoundX, Loader2 } from "lucide-react";
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


interface ClientsTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => Promise<void>;
  isLoadingDeleteForId?: string | null;
}

export function ClientsTable({ clients, onEdit, onDelete, isLoadingDeleteForId }: ClientsTableProps) {
  // CORREÇÃO AQUI: Se a condição for verdadeira, a função retorna este JSX.
  if (!clients || clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <UserRoundX className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Nenhum cliente encontrado</h3>
        <p className="text-muted-foreground">Adicione um novo cliente para começar a gerenciar.</p>
      </div>
    );
  }

  // Se o 'if' acima não for executado (ou seja, se houver clientes), então a função CONTINUA
  // e explicitamente retorna o JSX da tabela.
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">E-mail</TableHead>
            <TableHead className="hidden sm:table-cell">Telefone</TableHead>
            <TableHead className="hidden lg:table-cell">Cadastrado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{client.email || "Não informado"}</TableCell>
              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{client.phone || "Não informado"}</TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {client.createdAt instanceof Date ? format(client.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
              </TableCell>
              <TableCell className="text-right space-x-1 sm:space-x-2">
                <Button variant="outline" size="icon" onClick={() => onEdit(client)} aria-label="Editar cliente">
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" disabled={isLoadingDeleteForId === client.id} aria-label="Excluir cliente">
                      {isLoadingDeleteForId === client.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o cliente "{client.name}"? Esta ação não pode ser desfeita e todos os dados associados serão perdidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => client.id && (await onDelete(client.id))}>
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