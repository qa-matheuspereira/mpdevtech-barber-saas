import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, BarChart3, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const REPORT_TYPES = [
  {
    id: "appointments" as const,
    name: "Relatório de Agendamentos",
    description: "Todos os agendamentos realizados no período",
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    id: "revenue" as const,
    name: "Relatório de Receita",
    description: "Receita total, por serviço e por profissional",
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    id: "services" as const,
    name: "Relatório de Serviços",
    description: "Serviços mais agendados e performance",
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: "professionals" as const,
    name: "Relatório de Profissionais",
    description: "Performance e estatísticas por profissional",
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    id: "cancellations" as const,
    name: "Relatório de Cancelamentos",
    description: "Análise de cancelamentos e motivos",
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: "clients" as const,
    name: "Relatório de Clientes",
    description: "Clientes frequentes e histórico de agendamentos",
    icon: <FileText className="w-6 h-6" />,
  },
];

type ReportTypeId = typeof REPORT_TYPES[number]["id"];

function buildCSV(reportType: ReportTypeId, rows: any[]): string {
  const headers = [
    "ID", "Data/Hora", "Status", "Tipo", "Cliente", "Telefone",
    "Serviço", "Preço (R$)", "Duração (min)", "Profissional", "Observações"
  ];

  let filtered = rows;
  if (reportType === "cancellations") filtered = rows.filter(r => r.status === "cancelled");
  if (reportType === "revenue") filtered = rows.filter(r => r.status === "completed");

  const data = filtered.map(r => [
    r.id,
    r.scheduledTime ? new Date(r.scheduledTime).toLocaleString("pt-BR") : "",
    r.status,
    r.appointmentType,
    r.clientName ?? "",
    r.clientPhone ?? "",
    r.serviceName ?? "",
    r.servicePrice ? Number(r.servicePrice).toFixed(2) : "",
    r.serviceDuration ?? "",
    r.professionalName ?? "",
    r.notes ?? "",
  ]);

  if (reportType === "professionals") {
    const byProfessional = new Map<string, { count: number; revenue: number }>();
    for (const r of rows) {
      const name = r.professionalName ?? "Sem profissional";
      const prev = byProfessional.get(name) ?? { count: 0, revenue: 0 };
      prev.count++;
      if (r.status === "completed") prev.revenue += Number(r.servicePrice ?? 0);
      byProfessional.set(name, prev);
    }
    const profHeaders = ["Profissional", "Total Agendamentos", "Receita (R$)"];
    const profData = Array.from(byProfessional.entries()).map(([name, s]) => [
      name, s.count, s.revenue.toFixed(2)
    ]);
    return [profHeaders, ...profData].map(r => r.join(",")).join("\n");
  }

  if (reportType === "services") {
    const byService = new Map<string, { count: number; revenue: number }>();
    for (const r of rows) {
      const name = r.serviceName ?? "Sem serviço";
      const prev = byService.get(name) ?? { count: 0, revenue: 0 };
      prev.count++;
      if (r.status === "completed") prev.revenue += Number(r.servicePrice ?? 0);
      byService.set(name, prev);
    }
    const svcHeaders = ["Serviço", "Total Agendamentos", "Receita (R$)"];
    const svcData = Array.from(byService.entries()).map(([name, s]) => [
      name, s.count, s.revenue.toFixed(2)
    ]);
    return [svcHeaders, ...svcData].map(r => r.join(",")).join("\n");
  }

  if (reportType === "clients") {
    const byClient = new Map<string, { count: number; phone: string }>();
    for (const r of rows) {
      const name = r.clientName ?? "Sem nome";
      const prev = byClient.get(name) ?? { count: 0, phone: r.clientPhone ?? "" };
      prev.count++;
      byClient.set(name, prev);
    }
    const clientHeaders = ["Cliente", "Telefone", "Total Agendamentos"];
    const clientData = Array.from(byClient.entries()).map(([name, s]) => [
      name, s.phone, s.count
    ]);
    return [clientHeaders, ...clientData].map(r => r.join(",")).join("\n");
  }

  return [headers, ...data].map(r => r.join(",")).join("\n");
}

export default function ReportsExport() {
  const [selectedReport, setSelectedReport] = useState<ReportTypeId | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const { data: establishments, isLoading: loadingShops } = trpc.establishment.list.useQuery();

  const effectiveId = selectedEstablishment
    ? parseInt(selectedEstablishment)
    : establishments?.[0]?.id ?? 0;

  const utils = trpc.useUtils();

  const handleExport = async () => {
    if (!selectedReport) {
      toast.error("Selecione um tipo de relatório");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Selecione o período");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Data inicial deve ser anterior à data final");
      return;
    }
    if (effectiveId === 0) {
      toast.error("Selecione um estabelecimento");
      return;
    }

    setIsExporting(true);
    try {
      const rows = await utils.analytics.getReport.fetch({
        establishmentId: effectiveId,
        reportType: selectedReport,
        startDate,
        endDate,
      });

      if (!rows || rows.length === 0) {
        toast.info("Nenhum dado encontrado para o período selecionado");
        return;
      }

      const csv = buildCSV(selectedReport, rows);
      const filename = `relatorio-${selectedReport}-${startDate}-a-${endDate}.csv`;

      const el = document.createElement("a");
      el.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
      el.setAttribute("download", filename);
      el.style.display = "none";
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);

      toast.success(`Relatório exportado: ${filename}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar relatório");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Exportar Relatórios</h1>
          <p className="text-muted-foreground mt-2">Gere e exporte relatórios detalhados do seu estabelecimento em CSV</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurar Exportação</CardTitle>
            <CardDescription>Selecione o tipo de relatório e período desejado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="est-select">Estabelecimento</Label>
              <Select
                value={selectedEstablishment || (establishments?.[0]?.id.toString() ?? "")}
                onValueChange={setSelectedEstablishment}
              >
                <SelectTrigger id="est-select" className="mt-2">
                  <SelectValue placeholder={loadingShops ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {(establishments ?? []).map((shop) => (
                    <SelectItem key={shop.id} value={shop.id.toString()}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Data Inicial</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="end-date">Data Final</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Tipo de Relatório</Label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {REPORT_TYPES.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedReport === report.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={selectedReport === report.id ? "text-blue-600" : "text-gray-600"}>
                        {report.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{report.name}</p>
                        <p className="text-xs text-muted-foreground">{report.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleExport}
                disabled={isExporting || !selectedReport || !startDate || !endDate}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 w-full"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? "Gerando..." : "Exportar CSV"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações sobre Relatórios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold mb-1">Agendamentos</p>
              <p className="text-muted-foreground">Lista completa com cliente, serviço, data e status</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Receita</p>
              <p className="text-muted-foreground">Apenas agendamentos concluídos com valores</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Serviços e Profissionais</p>
              <p className="text-muted-foreground">Totais agrupados por serviço ou profissional</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Cancelamentos</p>
              <p className="text-muted-foreground">Apenas agendamentos com status cancelado</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Clientes</p>
              <p className="text-muted-foreground">Total de agendamentos por cliente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
