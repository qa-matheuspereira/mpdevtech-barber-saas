import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Scissors, User, Search, Download } from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: number;
  clientName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: "completed" | "cancelled" | "confirmed" | "waiting";
  type: "scheduled" | "queue";
  price: number;
}

export default function AppointmentHistory() {
  const [selectedEstablishment, setSelectedEstablishment] = useState("1");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data
  const appointments: Appointment[] = [
    {
      id: 1,
      clientName: "João Silva",
      serviceName: "Corte + Barba",
      appointmentDate: "2026-02-01",
      appointmentTime: "14:30",
      status: "completed",
      type: "scheduled",
      price: 80,
    },
    {
      id: 2,
      clientName: "Carlos Santos",
      serviceName: "Corte",
      appointmentDate: "2026-02-01",
      appointmentTime: "15:00",
      status: "completed",
      type: "scheduled",
      price: 50,
    },
    {
      id: 3,
      clientName: "Pedro Oliveira",
      serviceName: "Barba",
      appointmentDate: "2026-02-02",
      appointmentTime: "10:00",
      status: "confirmed",
      type: "scheduled",
      price: 40,
    },
    {
      id: 4,
      clientName: "Ana Costa",
      serviceName: "Corte",
      appointmentDate: "2026-01-30",
      appointmentTime: "16:00",
      status: "cancelled",
      type: "scheduled",
      price: 50,
    },
    {
      id: 5,
      clientName: "Bruno Ferreira",
      serviceName: "Corte + Barba",
      appointmentDate: "2026-01-29",
      appointmentTime: "13:00",
      status: "completed",
      type: "queue",
      price: 80,
    },
  ];

  const establishments = [
    { id: "1", name: "Estabelecimento do João" },
    { id: "2", name: "Corte & Estilo" },
  ];

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesSearch =
      apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; label: string }> = {
      completed: { bg: "bg-green-100", text: "text-green-700", label: "Concluído" },
      confirmed: { bg: "bg-blue-100", text: "text-blue-700", label: "Confirmado" },
      cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelado" },
      waiting: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Aguardando" },
    };

    const variant = variants[status] || variants.confirmed;
    return (
      <Badge className={`${variant.bg} ${variant.text} border-0`}>
        {variant.label}
      </Badge>
    );
  };

  const handleExportCSV = () => {
    const csv = [
      ["ID", "Cliente", "Serviço", "Data", "Hora", "Status", "Tipo", "Preço"],
      ...filteredAppointments.map((apt) => [
        apt.id,
        apt.clientName,
        apt.serviceName,
        apt.appointmentDate,
        apt.appointmentTime,
        apt.status,
        apt.type,
        `R$ ${apt.price.toFixed(2)}`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const element = document.createElement("a");
    element.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
    element.setAttribute("download", `agendamentos_${new Date().toISOString().split("T")[0]}.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Relatório exportado com sucesso!");
  };

  const totalRevenue = filteredAppointments
    .filter((apt) => apt.status === "completed")
    .reduce((sum, apt) => sum + apt.price, 0);

  const completedCount = filteredAppointments.filter((apt) => apt.status === "completed").length;
  const cancelledCount = filteredAppointments.filter((apt) => apt.status === "cancelled").length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Histórico de Agendamentos</h1>
            <p className="text-muted-foreground mt-2">Visualize e gerencie o histórico de agendamentos</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barbershop-select">Estabelecimento</Label>
            <Select value={selectedEstablishment} onValueChange={setSelectedEstablishment}>
              <SelectTrigger id="barbershop-select" className="w-64">
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Total de Agendamentos</p>
                <p className="text-3xl font-bold">{filteredAppointments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Cancelados</p>
                <p className="text-3xl font-bold text-red-600">{cancelledCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-3xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar por cliente ou serviço</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Digite o nome do cliente ou serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-48">
                <Label htmlFor="status-filter">Filtrar por Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="waiting">Aguardando</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleExportCSV} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <div className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {appointment.clientName.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{appointment.clientName}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Scissors className="w-4 h-4" />
                              {appointment.serviceName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(appointment.appointmentDate).toLocaleDateString("pt-BR")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {appointment.appointmentTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold">R$ {appointment.price.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.type === "scheduled" ? "Agendado" : "Fila"}
                        </p>
                      </div>
                      {getStatusBadge(appointment.status)}
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
