
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { PlusCircle, Loader2, PackageSearch, AlertTriangle } from "lucide-react";
import { ProductForm } from "@/components/products/product-form";
import { ProductsTable } from "@/components/products/products-table";
import { getProducts, addProduct, updateProduct, deleteProduct } from "@/services/productService";
import type { Product } from "@/lib/schemas/product";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const initialProductFormValues: Partial<Product> = {
  name: "",
  sku: "",
  price: 0,
  stock: 0,
  imageUrl: "",
};

export default function ProductsPage() {
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addProductFormDefaultValues, setAddProductFormDefaultValues] = useState<Partial<Product>>(initialProductFormValues);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading: isLoadingProducts, error: productsError, refetch: refetchProducts } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  useEffect(() => {
    if (productsError) {
      toast({
        title: "Erro ao Carregar Produtos",
        description: "Não foi possível buscar os dados dos produtos. Verifique sua conexão ou tente novamente.",
        variant: "destructive",
        duration: 10000,
      });
    }
  }, [productsError, toast]);

  const addProductMutation = useMutation({
    mutationFn: ({ productData, imageFile }: { productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl'>, imageFile?: File | null }) => 
      addProduct(productData, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto Adicionado", description: "Novo produto adicionado com sucesso." });
      setIsAddProductDialogOpen(false);
      setAddProductFormDefaultValues(initialProductFormValues); // Reset form for next add
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: `Falha ao adicionar produto: ${error.message}`, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, productData, imageFile, currentImageUrl }: { id: string; productData: Partial<Omit<Product, 'id' | 'createdAt' | 'imageUrl'>>; imageFile?: File | null | undefined, currentImageUrl?: string }) => 
      updateProduct(id, productData, imageFile, currentImageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Sucesso!", description: "Produto atualizado com sucesso." });
      setIsEditProductDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: `Falha ao atualizar produto: ${error.message}`, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Sucesso!", description: "Produto excluído com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: `Falha ao excluir produto: ${error.message}`, variant: "destructive" });
    },
  });

  const handleAddProduct = async (data: Product, imageFile?: File | null) => {
    const { id, createdAt, updatedAt, imageUrl, ...productData } = data;
    await addProductMutation.mutateAsync({ productData, imageFile });
  };

  const handleUpdateProduct = async (data: Product, imageFile?: File | null | undefined) => {
    if (!editingProduct || !editingProduct.id) return;
    const { id, createdAt, updatedAt, imageUrl: currentImgUrl, ...productData } = data;
    await updateProductMutation.mutateAsync({ id: editingProduct.id, productData, imageFile, currentImageUrl: editingProduct.imageUrl });
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProductMutation.mutateAsync(productId);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsEditProductDialogOpen(true);
  };
  
  const openAddDialog = () => {
    setAddProductFormDefaultValues(initialProductFormValues); 
    setIsAddProductDialogOpen(true);
  }

  const ProductListSkeleton = () => (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
         <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4 w-full">
            <Skeleton className="h-12 w-12 rounded-md bg-muted/50" />
            <div className="space-y-1.5 w-full">
              <Skeleton className="h-5 w-1/2 rounded bg-muted/50" />
              <Skeleton className="h-3 w-1/4 rounded bg-muted/50" />
            </div>
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
        <h1 className="font-headline text-3xl font-semibold text-foreground">Gerenciamento de Produtos</h1>
        <Dialog open={isAddProductDialogOpen} onOpenChange={(isOpen) => {
          setIsAddProductDialogOpen(isOpen);
          if (!isOpen) {
            setAddProductFormDefaultValues(initialProductFormValues); 
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Produto</DialogTitle>
              <DialogDescription>Preencha os detalhes do novo produto.</DialogDescription>
            </DialogHeader>
            <ProductForm 
              onSubmit={handleAddProduct} 
              isLoading={addProductMutation.isPending}
              defaultValues={addProductFormDefaultValues}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
          <CardDescription>Gerencie seu inventário de produtos e detalhes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
             <ProductListSkeleton />
          ) : productsError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-destructive">
              <AlertTriangle className="h-12 w-12" />
              <p className="text-lg font-medium">Erro ao carregar produtos</p>
              <p className="text-sm text-muted-foreground">{productsError.message}</p>
              <Button onClick={() => refetchProducts()} className="mt-3" disabled={isLoadingProducts}>
                {isLoadingProducts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <ProductsTable 
              products={products || []} 
              onEdit={openEditDialog} 
              onDelete={handleDeleteProduct}
              isLoadingDeleteForId={deleteProductMutation.isPending ? deleteProductMutation.variables : null}
            />
          )}
        </CardContent>
      </Card>

      {editingProduct && (
        <Dialog open={isEditProductDialogOpen} onOpenChange={(isOpen) => {
          setIsEditProductDialogOpen(isOpen);
          if (!isOpen) setEditingProduct(null);
        }}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
               <DialogDescription>Atualize os dados do produto selecionado.</DialogDescription>
            </DialogHeader>
            <ProductForm 
              onSubmit={handleUpdateProduct} 
              defaultValues={editingProduct} 
              isEditing 
              isLoading={updateProductMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
