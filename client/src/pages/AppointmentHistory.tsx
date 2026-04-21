import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Scissors, Search, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AppointmentHistory() {
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: establishments, isLoading: loadingShops } = trpc.establishment.list.useQuery();

  const effectiveId = selectedEstablishment
    ? parseInt(selectedEstablishment)
    : establishments?.[0]?.id ?? 0;

  const { data: appointments, isLoading } = trpc.appointments.list.useQuery(
    { establishmentId: effectiveId },
    { enabled: effectiveId > 0 }
  );

  const filtered = (appointments ?? []).filter((apt) => {
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (apt.clientName ?? "").toLowerCase().includes(term) ||
      (apt.serviceName ?? "").toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; label: string }> = {
      completed: { bg: "bg-green-100", text: "text-green-700", label: "Concluído" },
      confirmed: { bg: "bg-blue-100", text: "text-blue-700", label: "Confirmado" },
      cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelado" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Aguardando" },
      in_progress: { bg: "bg-purple-100", text: "text-purple-700", label: "Em Andamento" },
      no_show: { bg: "bg-gray-100", text: "text-gray-700", label: "Não Compareceu" },
    };
    const v = variants[status] ?? variants.confirmed;
    return <Badge className={`${v.bg} ${v.text} border-0`}>{v.label}</Badge>;
  };

  const handleExportCSV = () => {
    const csv = [
      ["ID", "Cliente", "Serviço", "Profissional", "Data", "Status", "Tipo", "Preço"],
      ...filtered.map((apt) => [
        apt.id,
        apt.clientName ?? "",
        apt.serviceName ?? "",
        apt.professionalName ?? "",
        apt.scheduledTime ? new Date(apt.scheduledTime).toLocaleString("pt-BR") : "",
        apt.status,
        apt.appointmentType,
        apt.servicePrice ? `R$ ${Number(apt.servicePrice).toFixed(2)}` : "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const el = document.createElement("a");
    el.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
    el.setAttribute("download", `agendamentos_${new Date().toISOString().split("T")[0]}.csv`);
    el.style.display = "none";
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
    toast.success("Relatório exportado com sucesso!");
  };

  const totalRevenue = filtered
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + Number(a.servicePrice ?? 0), 0);

  const completedCount = filtered.filter((a) => a.status === "completed").length;
  const cancelledCount = filtered.filter((a) => a.status === "cancelled").length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Histórico de Agendamentos</h1>
            <p className="text-muted-foreground mt-2">Visualize e gerencie o histórico de agendamentos</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="est-select">Estabelecimento</Label>
            <Select
              value={selectedEstablishment || (establishments?.[0]?.id.toString() ?? "")}
              onValueChange={setSelectedEstablishment}
            >
              <SelectTrigger id="est-select" className="w-64">
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
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-3xl font-bold">{filtered.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Concluídos</p>
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Cancelados</p>
              <p className="text-3xl font-bold text-red-600">{cancelledCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-3xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar por cliente ou serviço</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome do cliente ou serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="pending">Aguardando</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="no_show">Não Compareceu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleExportCSV}
                  disabled={filtered.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((apt) => (
              <Card key={apt.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {(apt.clientName ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{apt.clientName ?? "Cliente"}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {apt.serviceName && (
                              <div className="flex items-center gap-1">
                                <Scissors className="w-4 h-4" />
                                {apt.serviceName}
                              </div>
                            )}
                            {apt.scheduledTime && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(apt.scheduledTime).toLocaleDateString("pt-BR")}
                              </div>
                            )}
                            {apt.scheduledTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(apt.scheduledTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {apt.servicePrice && (
                          <p className="text-lg font-semibold">R$ {Number(apt.servicePrice).toFixed(2)}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {apt.appointmentType === "scheduled" ? "Agendado" : "Fila"}
                        </p>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
