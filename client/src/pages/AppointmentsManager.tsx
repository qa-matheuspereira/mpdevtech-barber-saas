import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, CheckCircle, XCircle, AlertCircle, Calendar, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import EditAppointmentModal from "@/components/EditAppointmentModal";
import CreateQueueAppointmentModal from "@/components/CreateQueueAppointmentModal";


export default function AppointmentsManager() {
  const [selectedEstablishment, setSelectedEstablishment] = useState<number | null>(null);
  const [operatingMode, setOperatingMode] = useState<"queue" | "scheduled" | "both">("both");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isConfirmingAppointment, setIsConfirmingAppointment] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<any | null>(null);
  const [isCreateQueueModalOpen, setIsCreateQueueModalOpen] = useState(false);

  // Fetch establishments
  const { data: establishments } = trpc.establishment.list.useQuery();

  // Fetch Google Calendar integration
  const { data: googleIntegration } = trpc.googleCalendar.getIntegration.useQuery(
    { establishmentId: selectedEstablishment || 0 },
    { enabled: !!selectedEstablishment }
  );

  // Fetch appointments
  const { data: appointments = [], isLoading: appointmentsLoading, refetch: refetchAppointments } = trpc.appointment.list.useQuery(
    { establishmentId: selectedEstablishment || 0 },
    { enabled: !!selectedEstablishment }
  );

  // Sync appointments mutation
  const syncAppointmentsMutation = trpc.googleCalendar.syncAppointments.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.syncedCount} agendamentos sincronizados com Google Calendar`);
      setIsSyncingGoogle(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao sincronizar com Google Calendar");
      setIsSyncingGoogle(false);
    },
  });

  // Update appointment status mutation
  const updateStatusMutation = trpc.appointment.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status do agendamento atualizado!");
      refetchAppointments();
      setIsConfirmingAppointment(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar agendamento");
    },
  });

  // Cancel appointment mutation
  const cancelMutation = trpc.appointment.cancel.useMutation({
    onSuccess: () => {
      toast.success("Agendamento cancelado!");
      refetchAppointments();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cancelar agendamento");
    },
  });

  // Filter and search appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt: any) => {
      const matchesSearch = searchQuery === "" ||
        apt.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.service?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
      const matchesMode = operatingMode === "both" || apt.appointmentType === (operatingMode === "queue" ? "queue" : "scheduled");

      return matchesSearch && matchesStatus && matchesMode;
    });
  }, [appointments, searchQuery, statusFilter, operatingMode]);

  // Separate scheduled and queue appointments
  const scheduledAppointments = filteredAppointments.filter((apt: any) => apt.appointmentType === "scheduled");
  const queueAppointments = filteredAppointments.filter((apt: any) => apt.appointmentType === "queue");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: <AlertCircle className="w-4 h-4" /> },
      confirmed: { bg: "bg-blue-100", text: "text-blue-800", icon: <Clock className="w-4 h-4" /> },
      in_progress: { bg: "bg-purple-100", text: "text-purple-800", icon: <Users className="w-4 h-4" /> },
      completed: { bg: "bg-green-100", text: "text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
      cancelled: { bg: "bg-red-100", text: "text-red-800", icon: <XCircle className="w-4 h-4" /> },
      no_show: { bg: "bg-gray-100", text: "text-gray-800", icon: <AlertCircle className="w-4 h-4" /> },
    };

    const variant = variants[status] || variants.pending;
    const statusLabels: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      in_progress: "Em Atendimento",
      completed: "Concluído",
      cancelled: "Cancelado",
      no_show: "Não Compareceu",
    };

    return (
      <Badge className={`${variant.bg} ${variant.text} border-0`}>
        <span className="mr-1">{variant.icon}</span>
        {statusLabels[status]}
      </Badge>
    );
  };

  const handleConfirmAppointment = (apt: any) => {
    setSelectedAppointment(apt);
    setIsConfirmingAppointment(true);
  };

  const handleUpdateStatus = async (appointmentId: number, newStatus: string) => {
    await updateStatusMutation.mutateAsync({
      appointmentId,
      status: newStatus as any,
    });
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
      await cancelMutation.mutateAsync({ appointmentId });
    }
  };

  const handleEditAppointment = (apt: any) => {
    setAppointmentToEdit(apt);
    setIsEditModalOpen(true);
  };

  const handleSyncGoogle = async () => {
    if (!selectedEstablishment) return;

    if (!googleIntegration?.isActive) {
      toast.error("Google Calendar não está conectado. Conecte primeiro nas configurações.");
      return;
    }

    setIsSyncingGoogle(true);
    await syncAppointmentsMutation.mutateAsync({ establishmentId: selectedEstablishment });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Agendamentos</h1>
            <p className="text-muted-foreground mt-2">Controle seus agendamentos e fila em tempo real</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barbershop-select">Estabelecimento</Label>
            <Select
              value={selectedEstablishment?.toString() || ""}
              onValueChange={(value) => setSelectedEstablishment(parseInt(value))}
            >
              <SelectTrigger id="barbershop-select" className="w-64">
                <SelectValue placeholder="Selecione um estabelecimento" />
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
        </div>

        {selectedEstablishment && (
          <>
            {/* Google Calendar Sync Button */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <CardTitle>Sincronizar com Google Calendar</CardTitle>
                  </div>
                  <Button
                    onClick={handleSyncGoogle}
                    disabled={isSyncingGoogle || !googleIntegration?.isActive}
                    className="gap-2"
                  >
                    {isSyncingGoogle ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        Sincronizar Agora
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>
                  {googleIntegration?.isActive
                    ? "Seus agendamentos serão sincronizados com Google Calendar"
                    : "Conecte Google Calendar nas configurações para sincronizar"}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Operating Mode */}
            <Card>
              <CardHeader>
                <CardTitle>Modo de Operação</CardTitle>
                <CardDescription>Escolha como você deseja gerenciar os agendamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {(["queue", "scheduled", "both"] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={operatingMode === mode ? "default" : "outline"}
                      onClick={() => setOperatingMode(mode)}
                      className="flex-1"
                    >
                      {mode === "queue" && "🚶 Fila Virtual"}
                      {mode === "scheduled" && "📅 Horário Marcado"}
                      {mode === "both" && "🔄 Ambos"}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por cliente ou serviço..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="in_progress">Em Atendimento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="scheduled" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scheduled">
                  Agendamentos ({scheduledAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="queue">Fila ({queueAppointments.length})</TabsTrigger>
              </TabsList>

              {/* Scheduled Appointments Tab */}
              <TabsContent value="scheduled" className="space-y-4">
                {appointmentsLoading ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Carregando agendamentos...</p>
                    </CardContent>
                  </Card>
                ) : scheduledAppointments.length > 0 ? (
                  <div className="grid gap-4">
                    {scheduledAppointments.map((apt: any) => (
                      <Card key={apt.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <div>
                                  <h3 className="font-semibold text-lg">{apt.client?.name || "Cliente"}</h3>
                                  <p className="text-sm text-muted-foreground">{apt.service?.name || "Serviço"}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-blue-600">
                                    {apt.scheduledTime
                                      ? format(new Date(apt.scheduledTime), "HH:mm", { locale: ptBR })
                                      : "N/A"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{apt.client?.phone || ""}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(apt.status)}
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              {apt.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(apt.id, "confirmed")}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Confirmar
                                </Button>
                              )}
                              {apt.status === "confirmed" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(apt.id, "in_progress")}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  Iniciar
                                </Button>
                              )}
                              {apt.status === "in_progress" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(apt.id, "completed")}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Concluir
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditAppointment(apt)}
                              >
                                Editar
                              </Button>
                              {["pending", "confirmed", "in_progress"].includes(apt.status) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelAppointment(apt.id)}
                                >
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Queue Tab */}
              <TabsContent value="queue" className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsCreateQueueModalOpen(true)}
                    className="gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Adicionar à Fila
                  </Button>
                </div>

                {appointmentsLoading ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Carregando fila...</p>
                    </CardContent>
                  </Card>
                ) : queueAppointments.length > 0 ? (
                  <div className="grid gap-4">
                    {queueAppointments.map((item: any, index: number) => (
                      <Card key={item.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                                <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                              </div>
                              <div>
                                <h3 className="font-semibold">{item.client?.name || "Cliente"}</h3>
                                <p className="text-sm text-muted-foreground">{item.service?.name || "Serviço"}</p>
                                <p className="text-xs text-muted-foreground">
                                  Entrou às{" "}
                                  {item.createdAt
                                    ? format(new Date(item.createdAt), "HH:mm", { locale: ptBR })
                                    : "N/A"}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {index === 0 && (
                                <Button
                                  onClick={() => handleUpdateStatus(item.id, "in_progress")}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Chamar Próximo
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelAppointment(item.id)}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground">Nenhum cliente na fila no momento</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {!selectedEstablishment && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">Selecione um estabelecimento</p>
              <p className="text-sm text-muted-foreground">
                Escolha um estabelecimento acima para visualizar agendamentos
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Appointment Modal */}
        {appointmentToEdit && (
          <EditAppointmentModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            appointment={appointmentToEdit}
            establishmentId={selectedEstablishment || 0}
            onSuccess={() => {
              refetchAppointments();
              setAppointmentToEdit(null);
            }}
          />
        )}

        {/* Create Queue Appointment Modal */}
        {selectedEstablishment && (
          <CreateQueueAppointmentModal
            open={isCreateQueueModalOpen}
            onOpenChange={setIsCreateQueueModalOpen}
            establishmentId={selectedEstablishment}
            onSuccess={() => refetchAppointments()}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
