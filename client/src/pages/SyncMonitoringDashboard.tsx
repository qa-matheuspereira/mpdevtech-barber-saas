import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Calendar,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SyncMonitoringDashboard() {
  const [selectedEstablishment, setSelectedEstablishment] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10); // segundos

  // Fetch establishments
  const { data: establishments } = trpc.establishment.list.useQuery();

  // Fetch sync stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.googleCalendar.getSyncStats.useQuery(
    { establishmentId: selectedEstablishment || 0, hoursBack: 24 },
    { enabled: !!selectedEstablishment }
  );

  // Fetch sync logs
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = trpc.googleCalendar.getSyncLogs.useQuery(
    { establishmentId: selectedEstablishment || 0, limit: 20 },
    { enabled: !!selectedEstablishment }
  );

  // Fetch recent errors
  const { data: errors, refetch: refetchErrors } = trpc.googleCalendar.getRecentErrors.useQuery(
    { establishmentId: selectedEstablishment || 0, limit: 5 },
    { enabled: !!selectedEstablishment }
  );

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !selectedEstablishment) return;

    const interval = setInterval(() => {
      refetchStats();
      refetchLogs();
      refetchErrors();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedEstablishment, refetchStats, refetchLogs, refetchErrors]);

  const handleManualRefresh = async () => {
    toast.loading("Atualizando dados...");
    await Promise.all([refetchStats(), refetchLogs(), refetchErrors()]);
    toast.dismiss();
    toast.success("Dados atualizados!");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      partial: "bg-yellow-100 text-yellow-800",
      pending: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      case "partial":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const successRate = stats && stats.totalEvents > 0
    ? Math.round((stats.totalSuccessful / stats.totalEvents) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Monitoramento de Sincronização</h1>
        </div>
      </div>

      {/* Establishment Selection and Controls */}
      <div className="bg-white rounded-lg border border-border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Establishment Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Selecionar Estabelecimento</label>
            <Select
              value={selectedEstablishment?.toString() || ""}
              onValueChange={(value) => setSelectedEstablishment(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha um estabelecimento" />
              </SelectTrigger>
              <SelectContent>
                {establishments?.map((shop: any) => (
                  <SelectItem key={shop.id} value={shop.id.toString()}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="block text-sm font-medium mb-2">Intervalo de Atualização</label>
            <Select
              value={refreshInterval.toString()}
              onValueChange={(value) => setRefreshInterval(parseInt(value))}
              disabled={!autoRefresh}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 segundos</SelectItem>
                <SelectItem value="10">10 segundos</SelectItem>
                <SelectItem value="30">30 segundos</SelectItem>
                <SelectItem value="60">1 minuto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Controls */}
          <div className="flex items-end gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              {autoRefresh ? "Auto" : "Manual"}
            </Button>
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={statsLoading || logsLoading}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {selectedEstablishment && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Syncs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Sincronizações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSyncs}</div>
              <p className="text-xs text-muted-foreground mt-1">Últimas 24 horas</p>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{successRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalSuccessful} de {stats.totalEvents} eventos
              </p>
            </CardContent>
          </Card>

          {/* Failed Syncs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sincronizações Falhadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedSyncs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalErrors} eventos com erro
              </p>
            </CardContent>
          </Card>

          {/* Average Duration */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Duração Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageDuration}ms</div>
              <p className="text-xs text-muted-foreground mt-1">
                Última sincronização:{" "}
                {stats.lastSync
                  ? format(new Date(stats.lastSync), "HH:mm", { locale: ptBR })
                  : "Nunca"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sync Status Overview */}
      {selectedEstablishment && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumo de Status
            </CardTitle>
            <CardDescription>Distribuição de sincronizações nas últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.successfulSyncs}</div>
                <p className="text-sm text-muted-foreground">Bem-sucedidas</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.failedSyncs}</div>
                <p className="text-sm text-muted-foreground">Falhadas</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.partialSyncs}</div>
                <p className="text-sm text-muted-foreground">Parciais</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalEvents}</div>
                <p className="text-sm text-muted-foreground">Total de Eventos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Errors */}
      {selectedEstablishment && errors && errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erros Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errors.map((error) => (
                <div key={error.id} className="text-sm p-2 bg-white rounded border border-red-200">
                  <div className="font-medium text-red-900">
                    {error.syncType} - {format(new Date(error.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                  </div>
                  <div className="text-red-700">{error.errorMessage}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Logs Table */}
      {selectedEstablishment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Sincronizações
            </CardTitle>
            <CardDescription>Últimas sincronizações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p>Carregando logs...</p>
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Eventos</TableHead>
                      <TableHead>Sucesso</TableHead>
                      <TableHead>Erros</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium capitalize">{log.syncType}</TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            {getStatusIcon(log.status)}
                            {log.status === "success" && "Sucesso"}
                            {log.status === "error" && "Erro"}
                            {log.status === "partial" && "Parcial"}
                            {log.status === "pending" && "Pendente"}
                          </div>
                        </TableCell>
                        <TableCell>{log.totalEvents}</TableCell>
                        <TableCell className="text-green-600 font-medium">{log.successCount}</TableCell>
                        <TableCell className="text-red-600 font-medium">{log.errorCount}</TableCell>
                        <TableCell>{log.duration ? `${log.duration}ms` : "-"}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(log.createdAt), "dd/MM HH:mm:ss", {
                            locale: ptBR,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum log de sincronização encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedEstablishment && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              Selecione um estabelecimento
            </p>
            <p className="text-sm text-muted-foreground">
              Escolha um estabelecimento acima para visualizar o status de sincronização
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
