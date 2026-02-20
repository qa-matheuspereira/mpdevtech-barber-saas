import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Calendar, DollarSign, Users, TrendingUp, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export default function Analytics() {
  const [period, setPeriod] = useState("week");
  // Fetch user's establishments
  const { data: establishments, isLoading: loadingShops } = trpc.establishment.list.useQuery();
  const [selectedestablishmentId, setSelectedestablishmentId] = useState<string>("");

  const effectiveestablishmentId = selectedestablishmentId
    ? parseInt(selectedestablishmentId)
    : establishments?.[0]?.id ?? 0;

  // Calculate date range based on period
  const calculateDateRange = () => {
    const today = new Date();
    switch (period) {
      case "today":
        return { startDate: new Date(today.setHours(0, 0, 0, 0)), endDate: new Date(today.setHours(23, 59, 59, 999)) };
      case "week":
        return { startDate: startOfWeek(today), endDate: endOfWeek(today) };
      case "month":
        return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
      case "year":
        return { startDate: startOfYear(today), endDate: endOfYear(today) };
      default:
        return { startDate: undefined, endDate: undefined };
    }
  };

  const { startDate, endDate } = calculateDateRange();

  // Fetch Dashboard Stats
  const { data: stats, isLoading: loadingStats } = trpc.analytics.getDashboardStats.useQuery(
    { establishmentId: effectiveestablishmentId, startDate, endDate },
    { enabled: effectiveestablishmentId > 0 }
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Relatório</h1>
            <p className="text-muted-foreground mt-2">Visão geral do desempenho do seu estabelecimento</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-0">
              {loadingShops ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : (
                <Select
                  value={selectedestablishmentId || (establishments?.[0]?.id?.toString() ?? "")}
                  onValueChange={setSelectedestablishmentId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {establishments?.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id.toString()}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        {loadingStats ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats?.totalRevenue.toFixed(2) || "0.00"}</div>
                  <p className="text-xs text-muted-foreground">
                    {period === 'month' ? 'Neste mês' : period === 'week' ? 'Nesta semana' : 'Neste período'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalAppointments || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.completedAppointments || 0} concluídos
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats?.averageTicket.toFixed(2) || "0.00"}</div>
                  <p className="text-xs text-muted-foreground">
                    Por agendamento
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cancelamentos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.cancelledAppointments || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Agendamentos cancelados
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="services">Serviços</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Receita no Período</CardTitle>
                    <CardDescription>
                      Visualização da receita ao longo do tempo. (Em breve: gráfico detalhado)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                      Gráfico de Receita em Desenvolvimento
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="services" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Serviços Mais Populares</CardTitle>
                    <CardDescription>
                      Desempenho por tipo de serviço. (Em breve: gráfico detalhado)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                      Gráfico de Serviços em Desenvolvimento
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
