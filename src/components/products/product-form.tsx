
"use client";

import React, { useState, useEffect, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductSchema, type Product } from "@/lib/schemas/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Added import
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, UploadCloud, XCircle } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

interface ProductFormProps {
  onSubmit: (data: Product, imageFile?: File | null) => Promise<void>; // Add imageFile to onSubmit
  defaultValues?: Partial<Product>;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function ProductForm({ onSubmit, defaultValues, isEditing = false, isLoading = false }: ProductFormProps) {
  const { toast } = useToast();
  const form = useForm<Product>({
    resolver: zodResolver(ProductSchema),
    defaultValues: defaultValues || {
      name: "",
      sku: "",
      price: 0,
      stock: 0,
      imageUrl: "",
    },
  });

  const [imagePreview, setImagePreview] = useState<string | null>(defaultValues?.imageUrl || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  // State to track if user intends to remove image (only for existing images)
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);


  useEffect(() => {
    // When defaultValues change (e.g., editing a different product or form reset)
    form.reset(defaultValues || { name: "", sku: "", price: 0, stock: 0, imageUrl: "" });
    setImagePreview(defaultValues?.imageUrl || null);
    setImageFile(null); // Reset file input
    setRemoveCurrentImage(false);
  }, [defaultValues, form]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Arquivo Muito Grande", description: "A imagem deve ter no máximo 2MB.", variant: "destructive" });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveCurrentImage(false); // If new image is selected, don't remove current
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (isEditing && defaultValues?.imageUrl) {
      setRemoveCurrentImage(true); // Mark for removal on submit if it's an existing image
    }
  };

  const handleFormSubmit = async (data: Product) => {
    // If removeCurrentImage is true, pass null for imageFile to signal removal
    // Otherwise, pass the current imageFile (which could be a new file or null if no new file was chosen)
    const fileToSend = removeCurrentImage ? null : imageFile;
    await onSubmit(data, fileToSend);

    if (!isEditing && !isLoading) {
      // Reset form fully on successful add
      form.reset({ name: "", sku: "", price: 0, stock: 0, imageUrl: "" });
      setImagePreview(null);
      setImageFile(null);
      setRemoveCurrentImage(false);
    } else if (isEditing && !isLoading) {
        // For editing, if image was removed and saved, clear preview etc.
        if(removeCurrentImage) {
            setImagePreview(null);
        }
        setRemoveCurrentImage(false); // Always reset this flag after submit
        setImageFile(null); // Clear staged file after submit
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
              <FormLabel>Nome do Produto</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Película de Vidro 3D" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: PEL-IP13-VID3D"
                  {...field}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    input.value = input.value.toUpperCase();
                    field.onChange(input.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de Venda (R$)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Ex: 29,90" {...field}
                    onChange={e => field.onChange(e.target.value.replace('.',','))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Atual</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ex: 50" {...field}
                    onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <FormLabel htmlFor="productImage">Imagem do Produto (Opcional)</FormLabel>
          {imagePreview && (
            <div className="my-2 relative w-32 h-32 border rounded-md p-1 bg-muted/30">
              <Image
                src={imagePreview}
                alt="Prévia do Produto"
                fill
                style={{ objectFit: "contain" }}
                data-ai-hint="product image"
                unoptimized={imagePreview.startsWith('blob:')}
                onError={() => {
                  setImagePreview(null);
                  toast({ title: "Erro de Imagem", description: "Não foi possível carregar a prévia da imagem.", variant: "destructive" });
                }}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Label className="cursor-pointer flex items-center">
                <UploadCloud className="mr-2 h-4 w-4" /> {imagePreview ? "Alterar Imagem" : "Carregar Imagem"}
                <Input id="productImage" type="file" accept="image/png, image/jpeg, image/webp" className="sr-only" onChange={handleImageChange} />
              </Label>
            </Button>
            {imagePreview && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemoveImage} className="text-destructive hover:text-destructive flex items-center">
                <XCircle className="mr-1 h-4 w-4" /> Remover Imagem
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Máx 2MB. PNG, JPG, WEBP.</p>
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Salvar Alterações" : "Adicionar Produto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
