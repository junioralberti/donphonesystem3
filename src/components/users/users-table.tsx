"use client";

import type { User } from "@/lib/schemas/user";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, UserX, Loader2, ShieldCheck, UserCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => Promise<void>;
  isLoadingDeleteForId?: string | null;
  currentUserId?: string | null; // To prevent admin from deleting themselves easily
}

export function UsersTable({ users, onEdit, onDelete, isLoadingDeleteForId, currentUserId }: UsersTableProps) {
  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <UserX className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Nenhum usuário encontrado</h3>
        <p className="text-muted-foreground">Adicione um novo usuário para começar.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">E-mail</TableHead>
            <TableHead>Função</TableHead>
            <TableHead className="hidden lg:table-cell">Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize flex items-center gap-1 w-fit">
                  {user.role === 'admin' ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserCircle className="h-3.5 w-3.5" />}
                  {user.role === 'admin' ? 'Admin' : 'Usuário'}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                   {user.createdAt instanceof Date ? format(user.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : (user.createdAt ? String(user.createdAt) : 'N/A')}
              </TableCell>
              <TableCell className="text-right space-x-1 sm:space-x-2">
                <Button variant="outline" size="icon" onClick={() => onEdit(user)} aria-label="Editar usuário" disabled={!user.id}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      disabled={isLoadingDeleteForId === user.id || currentUserId === user.id || !user.id}
                      aria-label="Excluir usuário"
                      title={currentUserId === user.id ? "Não é possível excluir o próprio usuário" : "Excluir usuário"}
                    >
                      {isLoadingDeleteForId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o usuário "{user.name}" ({user.email})? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      {/* Removido o marcador de conflito e aceitando 'await onDelete(user.id)' */}
                      <AlertDialogAction onClick={async () => user.id && await onDelete(user.id)}>
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