
"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Loader2, AlertTriangle, Landmark, ListChecks, CalendarClock, LineChart, Settings2, Trash2, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { ExpenseForm } from "@/components/finance/expense-form";
import { ExpensesTable } from "@/components/finance/expenses-table";
import { addExpense, getExpenses, updateExpense, deleteExpense, getExpensesByDateRange } from "@/services/expenseService";
import type { Expense, ExpenseFormData, ExpenseStatus, ExpenseCategory } from "@/lib/schemas/expense";
import { expenseCategories } from "@/lib/schemas/expense";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfMonth, endOfMonth, getYear, getMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Cell as RechartsPrimitiveCell } from "recharts"
import { ChartContainer, ChartTooltipContent, RechartsTooltip, RechartsLegend } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";


const currentYear = new Date().getFullYear();
const yearsForFilter = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // Last 5 years, current, next 4
const monthsForFilter = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: format(new Date(currentYear, i), "MMMM", { locale: ptBR }),
}));


export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState("lista");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Dialog states
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filters for "Lista de Despesas"
  const [filterMonth, setFilterMonth] = useState<number | undefined>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number | undefined>(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | "all">("all");

  const { data: expenses, isLoading: isLoadingExpenses, error: expensesError, refetch: refetchExpenses } = useQuery<Expense[], Error>({
    queryKey: ["expenses", filterYear, filterMonth, filterCategory, filterStatus],
    queryFn: () => getExpenses({
      year: filterYear,
      month: filterMonth,
      category: filterCategory === "all" ? undefined : filterCategory,
      status: filterStatus === "all" ? undefined : filterStatus,
    }),
    enabled: true, // Fetch on mount and when filters change
  });

  useEffect(() => {
    if (expensesError) {
      toast({
        title: "Erro ao Carregar Despesas",
        description: expensesError.message || "Não foi possível buscar os dados das despesas.",
        variant: "destructive",
      });
    }
  }, [expensesError, toast]);

  const addExpenseMutation = useMutation({
    mutationFn: (newExpenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => addExpense(newExpenseData as any), // Type assertion for dueDate
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseReportData"] });
      toast({ title: "Despesa Adicionada", description: "Nova despesa registrada com sucesso." });
      setIsAddExpenseDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Adicionar", description: error.message, variant: "destructive" });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>> }) => updateExpense(id, data as any), // Type assertion for dueDate/paymentDate
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseReportData"] });
      toast({ title: "Despesa Atualizada", description: "Dados da despesa atualizados." });
      setIsEditExpenseDialogOpen(false);
      setEditingExpense(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseReportData"] });
      toast({ title: "Despesa Excluída", description: "Despesa removida com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
    },
  });

  const handleFormSubmit = async (data: ExpenseFormData) => {
    const expenseDataToSave = {
        ...data,
        amount: parseFloat(String(data.amount).replace(',', '.')),
        dueDate: parseISO(data.dueDate), // Convert string date from form to Date object
        paymentDate: data.paymentDate ? parseISO(data.paymentDate) : null,
    };
    
    if (editingExpense && editingExpense.id) {
      // Explicitly omit id, createdAt, updatedAt if they are part of ExpenseFormData
      const { id, createdAt, updatedAt, ...updateData } = expenseDataToSave;
      await updateExpenseMutation.mutateAsync({ id: editingExpense.id, data: updateData });
    } else {
      const { id, createdAt, updatedAt, ...createData } = expenseDataToSave; // Ensure these are not passed if present
      await addExpenseMutation.mutateAsync(createData);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditExpenseDialogOpen(true);
  };
  
  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpenseMutation.mutateAsync(expenseId);
  };

  const handleToggleStatus = async (expenseId: string, currentStatus: ExpenseStatus, paymentDate?: Date) => {
    const newStatus = currentStatus === "Pendente" ? "Pago" : "Pendente";
    const updateData: Partial<Expense> = { status: newStatus };
    if (newStatus === "Pago") {
      updateData.paymentDate = paymentDate || new Date(); // If paymentDate not provided, set to now
    } else {
      updateData.paymentDate = null; // Clear payment date if moving to Pendente
    }
    await updateExpenseMutation.mutateAsync({ id: expenseId, data: updateData });
  };

  // For Agenda de Pagamentos
  const pendingExpenses = useMemo(() => {
    return (expenses || []).filter(exp => exp.status === "Pendente").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [expenses]);

  // For Relatório Financeiro
  const [reportMonth, setReportMonth] = useState(new Date());

  const { data: expenseReportData, isLoading: isLoadingReport } = useQuery({
    queryKey: ["expenseReportData", format(reportMonth, 'yyyy-MM')],
    queryFn: async () => {
      const SDate = startOfMonth(reportMonth);
      const EDate = endOfMonth(reportMonth);
      const monthlyExpenses = await getExpensesByDateRange(SDate, EDate);
      
      const paid = monthlyExpenses.filter(e => e.status === "Pago").reduce((sum, e) => sum + e.amount, 0);
      const pending = monthlyExpenses.filter(e => e.status === "Pendente").reduce((sum, e) => sum + e.amount, 0);
      const total = paid + pending;

      const categoriesSummary: { name: ExpenseCategory; paid: number; pending: number; total: number }[] = expenseCategories.map(cat => ({
        name: cat,
        paid: monthlyExpenses.filter(e => e.category === cat && e.status === "Pago").reduce((s, e) => s + e.amount, 0),
        pending: monthlyExpenses.filter(e => e.category === cat && e.status === "Pendente").reduce((s, e) => s + e.amount, 0),
        total: monthlyExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
      })).filter(c => c.total > 0); // Only show categories with expenses

      return { paid, pending, total, categoriesSummary, monthLabel: format(reportMonth, "MMMM/yyyy", { locale: ptBR }) };
    },
  });
  
  const chartConfig = {
    total: { label: "Total", color: "hsl(var(--chart-1))" },
    paid: { label: "Pago", color: "hsl(var(--chart-2))" },
    pending: { label: "Pendente", color: "hsl(var(--chart-3))" },
  } satisfies Record<string, { label: string; color: string }>;


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-semibold flex items-center gap-2">
          <Landmark /> Financeiro
        </h1>
        <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Despesa</DialogTitle>
              <DialogDescription>Preencha os dados da nova despesa.</DialogDescription>
            </DialogHeader>
            <ExpenseForm 
              onSubmit={handleFormSubmit} 
              isLoading={addExpenseMutation.isPending}
              onClose={() => setIsAddExpenseDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4">
          <TabsTrigger value="lista"><ListChecks className="mr-2 h-4 w-4 sm:hidden"/>Lista de Despesas</TabsTrigger>
          <TabsTrigger value="agenda"><CalendarClock className="mr-2 h-4 w-4 sm:hidden"/>Agenda</TabsTrigger>
          <TabsTrigger value="relatorio"><LineChart className="mr-2 h-4 w-4 sm:hidden"/>Relatório</TabsTrigger>
          <TabsTrigger value="config" disabled><Settings2 className="mr-2 h-4 w-4 sm:hidden"/>Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Despesas</CardTitle>
              <CardDescription>Visualize e gerencie suas despesas cadastradas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 flex-wrap items-center">
                <Select value={String(filterYear)} onValueChange={(val) => setFilterYear(Number(val))}>
                  <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="Ano" /></SelectTrigger>
                  <SelectContent>
                    {yearsForFilter.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={String(filterMonth)} onValueChange={(val) => setFilterMonth(Number(val))}>
                  <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Mês" /></SelectTrigger>
                  <SelectContent>
                    {monthsForFilter.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={(val: ExpenseCategory | "all") => setFilterCategory(val)}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(val: ExpenseStatus | "all") => setFilterStatus(val)}>
                  <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => refetchExpenses()} variant="outline" className="w-full sm:w-auto" disabled={isLoadingExpenses}>
                    {isLoadingExpenses ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Aplicar Filtros
                </Button>
              </div>
              {expensesError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><span className="font-semibold ml-2">Erro:</span><span className="ml-1">{expensesError.message}</span></Alert>}
              <ExpensesTable 
                expenses={expenses || []} 
                onEdit={handleEditExpense} 
                onDelete={handleDeleteExpense}
                onToggleStatus={handleToggleStatus}
                isLoading={isLoadingExpenses}
                isLoadingDeleteForId={deleteExpenseMutation.isPending ? deleteExpenseMutation.variables : null}
                isLoadingToggleForId={updateExpenseMutation.isPending ? updateExpenseMutation.variables?.id : null}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agenda">
          <Card>
            <CardHeader>
              <CardTitle>Agenda de Pagamentos</CardTitle>
              <CardDescription>Despesas pendentes ordenadas por data de vencimento.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingExpenses && <div className="flex justify-center p-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              {expensesError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><span className="font-semibold ml-2">Erro:</span><span className="ml-1">{expensesError.message}</span></Alert>}
              {!isLoadingExpenses && !expensesError && pendingExpenses.length === 0 && (
                <p className="text-muted-foreground text-center py-6">Nenhuma despesa pendente para exibir.</p>
              )}
              {!isLoadingExpenses && !expensesError && pendingExpenses.length > 0 && (
                 <div className="space-y-3">
                    {pendingExpenses.map(expense => (
                        <Card key={expense.id} className={`p-4 flex justify-between items-center ${new Date(expense.dueDate) < new Date() && expense.status === "Pendente" ? 'border-destructive bg-destructive/5' : ''}`}>
                            <div>
                                <h4 className="font-semibold">{expense.title} <Badge variant="outline" className="ml-2 text-xs">{expense.category}</Badge></h4>
                                <p className="text-sm text-muted-foreground">
                                    Vence em: {format(expense.dueDate, "dd/MM/yyyy", { locale: ptBR })} - Valor: {expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    size="sm" 
                                    variant={expense.status === "Pago" ? "secondary" : "default"}
                                    onClick={() => expense.id && handleToggleStatus(expense.id, expense.status, expense.status === "Pendente" ? new Date() : undefined)}
                                    disabled={updateExpenseMutation.isPending && updateExpenseMutation.variables?.id === expense.id}
                                    className="h-8 text-xs"
                                >
                                   {(updateExpenseMutation.isPending && updateExpenseMutation.variables?.id === expense.id) ? <Loader2 className="h-4 w-4 animate-spin"/> : (expense.status === "Pendente" ?  <CheckCircle2 className="mr-1 h-4 w-4"/> : <XCircle className="mr-1 h-4 w-4" />)}
                                   {expense.status === "Pendente" ? "Marcar como Pago" : "Marcar Pendente"}
                                </Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditExpense(expense)}><Pencil className="h-4 w-4"/></Button>
                            </div>
                        </Card>
                    ))}
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorio">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Financeiro de Despesas</CardTitle>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardDescription>Resumo de despesas pagas e pendentes por mês.</CardDescription>
                 <div className="flex gap-2 items-center">
                    <Button variant="outline" size="sm" onClick={() => setReportMonth(prev => subMonths(prev, 1))}>Mês Anterior</Button>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            size="sm"
                            className={cn("w-[180px] justify-start text-left font-normal")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(reportMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={reportMonth}
                            onSelect={(date) => date && setReportMonth(date)}
                            initialFocus
                            locale={ptBR}
                            captionLayout="dropdown-buttons" 
                            fromYear={currentYear-5} 
                            toYear={currentYear+4}
                        />
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="sm" onClick={() => setReportMonth(prev => addMonths(prev, 1))}>Próximo Mês</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingReport && <div className="flex justify-center p-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
              {!isLoadingReport && expenseReportData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground">Total Pago ({expenseReportData.monthLabel})</p>
                      <p className="text-2xl font-bold text-green-600">{expenseReportData.paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground">Total Pendente ({expenseReportData.monthLabel})</p>
                      <p className="text-2xl font-bold text-red-600">{expenseReportData.pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </Card>
                     <Card className="p-4">
                      <p className="text-sm text-muted-foreground">Total Geral ({expenseReportData.monthLabel})</p>
                      <p className="text-2xl font-bold">{expenseReportData.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </Card>
                  </div>
                  
                  {expenseReportData.categoriesSummary.length > 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Despesas por Categoria ({expenseReportData.monthLabel})</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                           <ChartContainer config={chartConfig} className="min-h-[300px] w-full aspect-auto">
                                <BarChart accessibilityLayer data={expenseReportData.categoriesSummary} layout="vertical" margin={{ right: 20, left: 20}}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis type="number" dataKey="total" hide/>
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        tickLine={false} 
                                        tickMargin={10} 
                                        axisLine={false} 
                                        className="text-xs"
                                        interval={0}
                                        width={100}
                                     />
                                    <RechartsTooltip 
                                        cursor={{ fill: "hsl(var(--muted))" }} 
                                        content={<ChartTooltipContent 
                                            formatter={(value, name, item) => {
                                                const { payload } = item;
                                                return (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium">{payload.name}</span>
                                                        <span className="text-xs text-muted-foreground">Pago: {payload.paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                        <span className="text-xs text-muted-foreground">Pendente: {payload.pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                        <span className="text-xs">Total: {payload.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                    </div>
                                                )
                                            }}
                                        />} 
                                    />
                                    <Bar dataKey="total" layout="vertical" radius={4} barSize={20}>
                                      {expenseReportData.categoriesSummary.map((entry, index) => (
                                         <RechartsPrimitiveCell key={`cell-${index}`} fill={index % 2 === 0 ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))"} />
                                      ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Nenhuma despesa registrada para {expenseReportData.monthLabel} para exibir no gráfico.</p>
                  )}

                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Financeiras</CardTitle>
              <CardDescription>Gerenciar categorias de despesas, lembretes, etc. (Funcionalidade pendente)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em breve: mais opções de configuração para o módulo financeiro.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseDialogOpen} onOpenChange={(isOpen) => {
        setIsEditExpenseDialogOpen(isOpen);
        if (!isOpen) setEditingExpense(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
            <DialogDescription>Atualize os dados da despesa selecionada.</DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm 
              onSubmit={handleFormSubmit} 
              defaultValues={{
                ...editingExpense,
                // Ensure dates are strings for the form if they are Date objects
                dueDate: format(editingExpense.dueDate instanceof Date ? editingExpense.dueDate : parseISO(String(editingExpense.dueDate)), 'yyyy-MM-dd'),
                paymentDate: editingExpense.paymentDate ? format(editingExpense.paymentDate instanceof Date ? editingExpense.paymentDate : parseISO(String(editingExpense.paymentDate)), 'yyyy-MM-dd') : null,
                amount: editingExpense.amount, // Amount is already a number
              }}
              isEditing 
              isLoading={updateExpenseMutation.isPending}
              onClose={() => setIsEditExpenseDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


    