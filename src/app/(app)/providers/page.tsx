
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { PlusCircle, Loader2, TruckIcon, AlertTriangle } from "lucide-react";
import { ProviderForm } from "@/components/providers/provider-form";
import { ProvidersTable } from "@/components/providers/providers-table";
import { getProviders, addProvider, updateProvider, deleteProvider } from "@/services/providerService";
import type { Provider } from "@/lib/schemas/provider";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProvidersPage() {
  const [isAddProviderDialogOpen, setIsAddProviderDialogOpen] = useState(false);
  const [isEditProviderDialogOpen, setIsEditProviderDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: providers, isLoading: isLoadingProviders, error: providersError, refetch: refetchProviders } = useQuery<Provider[], Error>({
    queryKey: ["providers"],
    queryFn: getProviders,
  });

  useEffect(() => {
    if (providersError) {
      toast({
        title: "Erro ao Carregar Fornecedores",
        description: "Não foi possível buscar os dados dos fornecedores. Verifique sua conexão ou tente novamente.",
        variant: "destructive",
        duration: 10000,
      });
    }
  }, [providersError, toast]);

  const addProviderMutation = useMutation({
    mutationFn: (newProvider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>) => addProvider(newProvider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast({ title: "Fornecedor Adicionado", description: "Novo fornecedor adicionado com sucesso." });
      setIsAddProviderDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: `Falha ao adicionar fornecedor: ${error.message}`, variant: "destructive" });
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Provider, 'id' | 'createdAt'>> }) => updateProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast({ title: "Sucesso!", description: "Fornecedor atualizado com sucesso." });
      setIsEditProviderDialogOpen(false);
      setEditingProvider(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: `Falha ao atualizar fornecedor: ${error.message}`, variant: "destructive" });
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: deleteProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast({ title: "Sucesso!", description: "Fornecedor excluído com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: `Falha ao excluir fornecedor: ${error.message}`, variant: "destructive" });
    },
  });

  const handleAddProvider = async (data: Provider) => {
    const { id, createdAt, updatedAt, ...providerData } = data;
    await addProviderMutation.mutateAsync(providerData);
  };

  const handleUpdateProvider = async (data: Provider) => {
    if (!editingProvider || !editingProvider.id) return;
    const { id, createdAt, updatedAt, ...providerData } = data;
    await updateProviderMutation.mutateAsync({ id: editingProvider.id, data: providerData });
  };

  const handleDeleteProvider = async (providerId: string) => {
    await deleteProviderMutation.mutateAsync(providerId);
  };

  const openEditDialog = (provider: Provider) => {
    setEditingProvider(provider);
    setIsEditProviderDialogOpen(true);
  };
  
  const ProviderListSkeleton = () => (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
         <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1.5 w-full">
            <Skeleton className="h-5 w-1/2 rounded bg-muted/50" />
            <Skeleton className="h-3 w-1/3 rounded bg-muted/50" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-9 rounded-md bg-muted/50" />
            <Skeleton className="h-9 w-9 rounded-md bg-muted/50" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-semibold text-foreground">Gerenciamento de Fornecedores</h1>
        <Dialog open={isAddProviderDialogOpen} onOpenChange={setIsAddProviderDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Fornecedor</DialogTitle>
              <DialogDescription>Preencha os dados do novo fornecedor.</DialogDescription>
            </DialogHeader>
            <ProviderForm 
              onSubmit={handleAddProvider} 
              isLoading={addProviderMutation.isPending} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
          <CardDescription>Gerencie seus fornecedores de peças e serviços.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProviders ? (
             <ProviderListSkeleton />
          ) : providersError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-destructive">
              <AlertTriangle className="h-12 w-12" />
              <p className="text-lg font-medium">Erro ao carregar fornecedores</p>
              <p className="text-sm text-muted-foreground">{providersError.message}</p>
              <Button onClick={() => refetchProviders()} className="mt-3" disabled={isLoadingProviders}>
                {isLoadingProviders && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <ProvidersTable 
              providers={providers || []} 
              onEdit={openEditDialog} 
              onDelete={handleDeleteProvider}
              isLoadingDeleteForId={deleteProviderMutation.isPending ? deleteProviderMutation.variables : null}
            />
          )}
        </CardContent>
      </Card>

      {editingProvider && (
        <Dialog open={isEditProviderDialogOpen} onOpenChange={(isOpen) => {
          setIsEditProviderDialogOpen(isOpen);
          if (!isOpen) setEditingProvider(null);
        }}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Editar Fornecedor</DialogTitle>
               <DialogDescription>Atualize os dados do fornecedor selecionado.</DialogDescription>
            </DialogHeader>
            <ProviderForm 
              onSubmit={handleUpdateProvider} 
              defaultValues={editingProvider} 
              isEditing 
              isLoading={updateProviderMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
