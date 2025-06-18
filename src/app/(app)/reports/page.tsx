
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BarChartHorizontalBig, PieChart, History, Info, Loader2, CalendarIcon, Download, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableSummaryFooter } from "@/components/ui/table";
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

import { getSalesByDateRange, type Sale } from "@/services/salesService";
import { getServiceOrdersByDateRangeAndStatus, type ServiceOrder, type ServiceOrderStatus } from "@/services/serviceOrderService";
import { getProducts, type Product } from "@/services/productService";

const serviceOrderStatusesForFilter: (ServiceOrderStatus | "Todos")[] = ["Todos", "Aberta", "Em andamento", "Aguardando peça", "Concluída", "Entregue", "Cancelada"];


export default function ReportsPage() {
  // Sales Report State
  const [salesStartDate, setSalesStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [salesEndDate, setSalesEndDate] = useState<Date | undefined>(new Date());
  const [salesReportData, setSalesReportData] = useState<Sale[] | null>(null);
  const [isGeneratingSalesReport, setIsGeneratingSalesReport] = useState(false);
  const [salesReportError, setSalesReportError] = useState<string | null>(null);

  // Service Orders Report State
  const [osStartDate, setOsStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [osEndDate, setOsEndDate] = useState<Date | undefined>(new Date());
  const [osStatusFilter, setOsStatusFilter] = useState<ServiceOrderStatus | "Todos">("Todos");
  const [osReportData, setOsReportData] = useState<ServiceOrder[] | null>(null);
  const [isGeneratingOsReport, setIsGeneratingOsReport] = useState(false);
  const [osReportError, setOsReportError] = useState<string | null>(null);

  // Inventory Report State
  const [inventoryReportData, setInventoryReportData] = useState<Product[] | null>(null);
  const [isGeneratingInventoryReport, setIsGeneratingInventoryReport] = useState(false);
  const [inventoryReportError, setInventoryReportError] = useState<string | null>(null);

  // Financial Report State
  const [financeStartDate, setFinanceStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [financeEndDate, setFinanceEndDate] = useState<Date | undefined>(new Date());
  const [financialReportData, setFinancialReportData] = useState<{ salesTotal: number; osTotal: number; grandTotal: number } | null>(null);
  const [isGeneratingFinancialReport, setIsGeneratingFinancialReport] = useState(false);
  const [financialReportError, setFinancialReportError] = useState<string | null>(null);

  const handleGenerateSalesReport = async () => {
    if (!salesStartDate || !salesEndDate) {
      setSalesReportError("Por favor, selecione as datas de início e fim.");
      return;
    }
    setIsGeneratingSalesReport(true);
    setSalesReportError(null);
    setSalesReportData(null);
    try {
      const data = await getSalesByDateRange(salesStartDate, salesEndDate);
      setSalesReportData(data);
    } catch (error) {
      console.error("Error generating sales report:", error);
      setSalesReportError(error instanceof Error ? error.message : "Erro desconhecido ao gerar relatório de vendas.");
    } finally {
      setIsGeneratingSalesReport(false);
    }
  };
  
  const handleGenerateOsReport = async () => {
    setIsGeneratingOsReport(true);
    setOsReportError(null);
    setOsReportData(null);
    try {
      const data = await getServiceOrdersByDateRangeAndStatus(osStartDate, osEndDate, osStatusFilter);
      setOsReportData(data);
    } catch (error) {
      console.error("Error generating OS report:", error);
      setOsReportError(error instanceof Error ? error.message : "Erro desconhecido ao gerar relatório de OS.");
    } finally {
      setIsGeneratingOsReport(false);
    }
  };

  const handleGenerateInventoryReport = async () => {
    setIsGeneratingInventoryReport(true);
    setInventoryReportError(null);
    setInventoryReportData(null);
    try {
      const data = await getProducts(); // Assuming getProducts fetches all products
      setInventoryReportData(data);
    } catch (error) {
      console.error("Error generating inventory report:", error);
      setInventoryReportError(error instanceof Error ? error.message : "Erro desconhecido ao gerar relatório de inventário.");
    } finally {
      setIsGeneratingInventoryReport(false);
    }
  };
  
  const handleGenerateFinancialReport = async () => {
    if (!financeStartDate || !financeEndDate) {
        setFinancialReportError("Por favor, selecione as datas de início e fim para o relatório financeiro.");
        return;
    }
    setIsGeneratingFinancialReport(true);
    setFinancialReportError(null);
    setFinancialReportData(null);
    try {
        const salesData = await getSalesByDateRange(financeStartDate, financeEndDate);
        const salesTotal = salesData.reduce((sum, sale) => sum + sale.totalAmount, 0);

        const completedOsData = await getServiceOrdersByDateRangeAndStatus(financeStartDate, financeEndDate, "Concluída");
        const deliveredOsData = await getServiceOrdersByDateRangeAndStatus(financeStartDate, financeEndDate, "Entregue");
        const osTotal = [...completedOsData, ...deliveredOsData].reduce((sum, os) => sum + os.grandTotalValue, 0);
        
        setFinancialReportData({
            salesTotal,
            osTotal,
            grandTotal: salesTotal + osTotal,
        });

    } catch (error) {
        console.error("Error generating financial report:", error);
        setFinancialReportError(error instanceof Error ? error.message : "Erro desconhecido ao gerar relatório financeiro.");
    } finally {
        setIsGeneratingFinancialReport(false);
    }
  };


  const renderDateRangePicker = (
    startDate: Date | undefined, 
    setStartDate: (date: Date | undefined) => void, 
    endDate: Date | undefined, 
    setEndDate: (date: Date | undefined) => void,
    prefix: string
  ) => (
    <div className="flex flex-col sm:flex-row gap-2 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={`${prefix}-start-date`}
            variant={"outline"}
            className={cn(
              "w-full sm:w-[200px] justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? format(startDate, "dd/MM/yyyy") : <span>Data Início</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={setStartDate}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
      <span className="hidden sm:inline">-</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={`${prefix}-end-date`}
            variant={"outline"}
            className={cn(
              "w-full sm:w-[200px] justify-start text-left font-normal",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, "dd/MM/yyyy") : <span>Data Fim</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={setEndDate}
            initialFocus
            locale={ptBR}
            disabled={(date) => startDate ? date < startDate : false}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-semibold">Relatórios</h1>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Relatórios Gerenciais</AlertTitle>
        <AlertDescription>
          Utilize os filtros abaixo para gerar relatórios detalhados sobre suas operações.
        </AlertDescription>
      </Alert>

      {/* Sales Report Card */}
      <Card>
        <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <BarChartHorizontalBig className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <CardTitle className="text-lg">Relatório de Vendas</CardTitle>
              <CardDescription className="text-xs">Analise suas vendas por período.</CardDescription>
            </div>
          </div>
          <Button onClick={handleGenerateSalesReport} disabled={isGeneratingSalesReport || !salesStartDate || !salesEndDate} className="w-full sm:w-auto mt-2 sm:mt-0">
            {isGeneratingSalesReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Gerar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderDateRangePicker(salesStartDate, setSalesStartDate, salesEndDate, setSalesEndDate, "sales")}
          {salesReportError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /> <AlertTitle>Erro</AlertTitle><AlertDescription>{salesReportError}</AlertDescription></Alert>}
          {isGeneratingSalesReport && <div className="flex justify-center items-center p-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Gerando relatório de vendas...</p></div>}
          {salesReportData && (
            <div className="mt-4">
              {salesReportData.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhuma venda encontrada para o período selecionado.</p>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="hidden sm:table-cell">Itens</TableHead>
                          <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                          <TableHead className="text-right">Valor Total (R$)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesReportData.map(sale => (
                          <TableRow key={sale.id}>
                            <TableCell>{format(new Date(sale.createdAt as Date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                            <TableCell>{sale.clientName || "Não informado"}</TableCell>
                            <TableCell className="hidden sm:table-cell">{sale.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                            <TableCell className="hidden md:table-cell">{sale.paymentMethod || "N/D"}</TableCell>
                            <TableCell className="text-right">{sale.totalAmount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableSummaryFooter>
                        <TableRow>
                            <TableCell colSpan={3} className="hidden md:table-cell"></TableCell>
                            <TableCell colSpan={2} className="md:hidden text-right font-semibold">Resumo:</TableCell>
                            <TableCell className="hidden md:table-cell text-right font-semibold">Total de Vendas:</TableCell>
                            <TableCell className="text-right font-bold">{salesReportData.length}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={3} className="hidden md:table-cell"></TableCell>
                            <TableCell colSpan={2} className="md:hidden text-right font-semibold">Valor Total:</TableCell>
                            <TableCell className="hidden md:table-cell text-right font-semibold">Valor Total Vendido:</TableCell>
                            <TableCell className="text-right font-bold">R$ {salesReportData.reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2)}</TableCell>
                        </TableRow>
                      </TableSummaryFooter>
                    </Table>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Orders Report Card */}
      <Card>
        <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <CardTitle className="text-lg">Relatório de Ordens de Serviço</CardTitle>
              <CardDescription className="text-xs">Filtre OS por período e status.</CardDescription>
            </div>
          </div>
          <Button onClick={handleGenerateOsReport} disabled={isGeneratingOsReport} className="w-full sm:w-auto mt-2 sm:mt-0">
            {isGeneratingOsReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Gerar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            {renderDateRangePicker(osStartDate, setOsStartDate, osEndDate, setOsEndDate, "os")}
            <Select value={osStatusFilter} onValueChange={(value: ServiceOrderStatus | "Todos") => setOsStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Status da OS" />
                </SelectTrigger>
                <SelectContent>
                    {serviceOrderStatusesForFilter.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          {osReportError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /> <AlertTitle>Erro</AlertTitle><AlertDescription>{osReportError}</AlertDescription></Alert>}
          {isGeneratingOsReport && <div className="flex justify-center items-center p-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Gerando relatório de OS...</p></div>}
          {osReportData && (
             <div className="mt-4">
              {osReportData.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhuma Ordem de Serviço encontrada para os filtros selecionados.</p>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nº OS</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="hidden md:table-cell">Aparelho</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden sm:table-cell">Abertura</TableHead>
                          <TableHead className="text-right">Valor (R$)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {osReportData.map(os => (
                          <TableRow key={os.id}>
                            <TableCell>{os.osNumber}</TableCell>
                            <TableCell>{os.clientName}</TableCell>
                            <TableCell className="hidden md:table-cell">{os.deviceBrandModel}</TableCell>
                            <TableCell>{os.status}</TableCell>
                            <TableCell className="hidden sm:table-cell">{format(new Date(os.openingDate as Date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                            <TableCell className="text-right">{os.grandTotalValue.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableSummaryFooter>
                        <TableRow>
                            <TableCell colSpan={4} className="hidden sm:table-cell"></TableCell>
                            <TableCell colSpan={3} className="sm:hidden text-right font-semibold">Resumo:</TableCell>
                            <TableCell className="hidden sm:table-cell text-right font-semibold">Total de OS:</TableCell>
                            <TableCell className="text-right font-bold">{osReportData.length}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={4} className="hidden sm:table-cell"></TableCell>
                            <TableCell colSpan={3} className="sm:hidden text-right font-semibold">Valor Total:</TableCell>
                            <TableCell className="hidden sm:table-cell text-right font-semibold">Valor Total OS:</TableCell>
                            <TableCell className="text-right font-bold">R$ {osReportData.reduce((sum, os) => sum + os.grandTotalValue, 0).toFixed(2)}</TableCell>
                        </TableRow>
                      </TableSummaryFooter>
                    </Table>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Financial Report Card */}
      <Card>
        <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <PieChart className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <CardTitle className="text-lg">Relatório Financeiro (Simplificado)</CardTitle>
              <CardDescription className="text-xs">Receita bruta de vendas e OS concluídas/entregues.</CardDescription>
            </div>
          </div>
          <Button onClick={handleGenerateFinancialReport} disabled={isGeneratingFinancialReport || !financeStartDate || !financeEndDate} className="w-full sm:w-auto mt-2 sm:mt-0">
            {isGeneratingFinancialReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Gerar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderDateRangePicker(financeStartDate, setFinanceStartDate, financeEndDate, setFinanceEndDate, "finance")}
          {financialReportError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /> <AlertTitle>Erro</AlertTitle><AlertDescription>{financialReportError}</AlertDescription></Alert>}
          {isGeneratingFinancialReport && <div className="flex justify-center items-center p-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Gerando relatório financeiro...</p></div>}
          {financialReportData && (
            <div className="mt-4 space-y-3 p-4 border rounded-md">
                <div className="flex justify-between"><span>Total Receita de Vendas:</span> <span className="font-medium">R$ {financialReportData.salesTotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Total Receita de OS (Concluídas/Entregues):</span> <span className="font-medium">R$ {financialReportData.osTotal.toFixed(2)}</span></div>
                <hr className="my-2"/>
                <div className="flex justify-between text-lg"><strong>Receita Bruta Total no Período:</strong> <strong className="text-primary">R$ {financialReportData.grandTotal.toFixed(2)}</strong></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Report Card */}
      <Card>
        <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <CardTitle className="text-lg">Relatório de Inventário</CardTitle>
              <CardDescription className="text-xs">Lista de produtos e seus estoques.</CardDescription>
            </div>
          </div>
           <Button onClick={handleGenerateInventoryReport} disabled={isGeneratingInventoryReport} className="w-full sm:w-auto mt-2 sm:mt-0">
            {isGeneratingInventoryReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Gerar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {inventoryReportError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /> <AlertTitle>Erro</AlertTitle><AlertDescription>{inventoryReportError}</AlertDescription></Alert>}
          {isGeneratingInventoryReport && <div className="flex justify-center items-center p-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Gerando relatório de inventário...</p></div>}
          {inventoryReportData && (
             <div className="mt-4">
              {inventoryReportData.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum produto encontrado.</p>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right hidden sm:table-cell">Preço (R$)</TableHead>
                          <TableHead className="text-center">Estoque</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryReportData.map(product => (
                          <TableRow key={product.id}>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell className="text-right hidden sm:table-cell">{product.price.toFixed(2)}</TableCell>
                            <TableCell className={`text-center ${product.stock === 0 ? 'text-destructive font-semibold' : (product.stock < 5 ? 'text-orange-600 font-medium' : '')}`}>
                                {product.stock}
                                {product.stock === 0 && <span className="text-xs ml-1">(Zerado)</span>}
                                {product.stock > 0 && product.stock < 5 && <span className="text-xs ml-1">(Baixo)</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}


    