import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, BarChart3, Calendar } from "lucide-react";
import { toast } from "sonner";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  formats: string[];
}

const REPORT_TYPES: ReportType[] = [
  {
    id: "appointments",
    name: "Relatório de Agendamentos",
    description: "Todos os agendamentos realizados no período",
    icon: <Calendar className="w-6 h-6" />,
    formats: ["CSV", "PDF", "Excel"],
  },
  {
    id: "revenue",
    name: "Relatório de Receita",
    description: "Receita total, por serviço e por profissional",
    icon: <BarChart3 className="w-6 h-6" />,
    formats: ["CSV", "PDF", "Excel"],
  },
  {
    id: "services",
    name: "Relatório de Serviços",
    description: "Serviços mais agendados e performance",
    icon: <FileText className="w-6 h-6" />,
    formats: ["CSV", "PDF", "Excel"],
  },
  {
    id: "barbers",
    name: "Relatório de Profissionais",
    description: "Performance e estatísticas por profissional",
    icon: <BarChart3 className="w-6 h-6" />,
    formats: ["CSV", "PDF", "Excel"],
  },
  {
    id: "cancellations",
    name: "Relatório de Cancelamentos",
    description: "Análise de cancelamentos e motivos",
    icon: <FileText className="w-6 h-6" />,
    formats: ["CSV", "PDF", "Excel"],
  },
  {
    id: "clients",
    name: "Relatório de Clientes",
    description: "Clientes frequentes e histórico de agendamentos",
    icon: <FileText className="w-6 h-6" />,
    formats: ["CSV", "PDF", "Excel"],
  },
];

export default function ReportsExport() {
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("PDF");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [establishmentId, setestablishmentId] = useState("1");
  const [isExporting, setIsExporting] = useState(false);

  const establishments = [
    { id: "1", name: "Estabelecimento do João" },
    { id: "2", name: "Corte & Estilo" },
  ];

  const selectedReportData = REPORT_TYPES.find((r) => r.id === selectedReport);

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

    setIsExporting(true);

    // Simulate export process
    setTimeout(() => {
      const filename = `relatorio-${selectedReport}-${new Date().toISOString().split("T")[0]}.${selectedFormat.toLowerCase()}`;
      toast.success(`Relatório exportado: ${filename}`);
      setIsExporting(false);
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Exportar Relatórios</h1>
          <p className="text-muted-foreground mt-2">Gere e exporte relatórios detalhados do seu estabelecimento</p>
        </div>

        {/* Export Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configurar Exportação</CardTitle>
            <CardDescription>Selecione o tipo de relatório e período desejado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Establishment Selection */}
            <div>
              <Label htmlFor="barbershop">Estabelecimento</Label>
              <Select value={establishmentId} onValueChange={setestablishmentId}>
                <SelectTrigger id="barbershop" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {establishments.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
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

            {/* Report Type Selection */}
            <div>
              <Label>Tipo de Relatório</Label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {REPORT_TYPES.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${selectedReport === report.id
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

            {/* Format Selection */}
            {selectedReportData && (
              <div>
                <Label htmlFor="format">Formato de Exportação</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger id="format" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedReportData.formats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Export Button */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleExport}
                disabled={isExporting || !selectedReport}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 flex-1"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Gerando..." : "Exportar Relatório"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Informações sobre Relatórios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-sm mb-2">Relatório de Agendamentos</p>
              <p className="text-sm text-muted-foreground">
                Lista completa de todos os agendamentos com detalhes do cliente, serviço, data e status
              </p>
            </div>

            <div>
              <p className="font-semibold text-sm mb-2">Relatório de Receita</p>
              <p className="text-sm text-muted-foreground">
                Análise financeira com receita total, por serviço e por profissional no período selecionado
              </p>
            </div>

            <div>
              <p className="font-semibold text-sm mb-2">Relatório de Serviços</p>
              <p className="text-sm text-muted-foreground">
                Serviços mais agendados, taxas de cancelamento e performance geral
              </p>
            </div>

            <div>
              <p className="font-semibold text-sm mb-2">Relatório de Profissionais</p>
              <p className="text-sm text-muted-foreground">
                Performance individual de cada profissional, incluindo agendamentos e receita
              </p>
            </div>

            <div>
              <p className="font-semibold text-sm mb-2">Relatório de Cancelamentos</p>
              <p className="text-sm text-muted-foreground">
                Análise de cancelamentos com motivos e impacto na receita
              </p>
            </div>

            <div>
              <p className="font-semibold text-sm mb-2">Relatório de Clientes</p>
              <p className="text-sm text-muted-foreground">
                Clientes mais frequentes, histórico de agendamentos e padrões de comportamento
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Exports */}
        <Card>
          <CardHeader>
            <CardTitle>Exportações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">relatorio-appointments-2026-02-01.pdf</p>
                  <p className="text-xs text-muted-foreground">Exportado há 2 horas</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">relatorio-revenue-2026-01-31.xlsx</p>
                  <p className="text-xs text-muted-foreground">Exportado há 1 dia</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
