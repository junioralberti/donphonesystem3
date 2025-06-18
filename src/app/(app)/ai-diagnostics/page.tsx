
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { suggestRepairSolutions, type SuggestRepairSolutionsOutput, type SuggestRepairSolutionsInput } from '@/ai/flows/suggest-repair-solutions';
import { useToast } from '@/hooks/use-toast';

export default function AiDiagnosticsPage() {
  const [problemDescription, setProblemDescription] = useState('');
  const [phoneModel, setPhoneModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SuggestRepairSolutionsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);

    if (!problemDescription || !phoneModel) {
      setError("Por favor, preencha a descrição do problema e o modelo do celular.");
      setIsLoading(false);
      toast({
        title: "Informação Faltando",
        description: "A descrição do problema e o modelo do celular são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const input: SuggestRepairSolutionsInput = { problemDescription, phoneModel };
      const output = await suggestRepairSolutions(input);
      setResults(output);
      toast({
        title: "Sugestões Prontas",
        description: "As sugestões de diagnóstico da IA foram geradas.",
        variant: "default",
      });
    } catch (err) {
      console.error("AI Diagnostic Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setError(`Falha ao obter sugestões: ${errorMessage}`);
      toast({
        title: "Erro",
        description: `Falha ao obter sugestões: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-semibold">Assistência de Diagnóstico com IA</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Diagnosticar Problema do Celular</CardTitle>
          <CardDescription>Insira a descrição do problema do cliente e o modelo do celular para obter sugestões de reparo com IA.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phoneModel">Modelo do Celular</Label>
              <Input 
                id="phoneModel" 
                value={phoneModel} 
                onChange={(e) => setPhoneModel(e.target.value)} 
                placeholder="ex: iPhone 13 Pro, Samsung Galaxy S21" 
                className="text-base"
              />
            </div>
            <div>
              <Label htmlFor="problemDescription">Descrição do Problema</Label>
              <Textarea 
                id="problemDescription" 
                value={problemDescription} 
                onChange={(e) => setProblemDescription(e.target.value)} 
                placeholder="ex: Tela rachada, celular não liga, bateria descarrega rápido..."
                rows={4}
                className="text-base"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Diagnosticando...
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Obter Sugestões
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Sugestões de Diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Soluções Sugeridas:</h3>
              {results.suggestedSolutions.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {results.suggestedSolutions.map((solution, index) => (
                    <li key={index}>{solution}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma solução específica sugerida.</p>
              )}
            </div>
            <hr />
            <div>
              <h3 className="font-semibold text-lg mb-1">Peças Necessárias:</h3>
              {results.partsNeeded && results.partsNeeded.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {results.partsNeeded.map((part, index) => (
                    <li key={index}>{part}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma peça específica identificada ou informação indisponível.</p>
              )}
            </div>
            <hr />
            <div>
              <h3 className="font-semibold text-lg mb-1">Tempo Estimado de Reparo:</h3>
              {results.estimatedRepairTime ? (
                 <p className="text-sm">{results.estimatedRepairTime}</p>
              ) : (
                 <p className="text-muted-foreground text-sm">Tempo estimado não fornecido pela IA.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
