import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertCircle, Calendar, Clock, Scissors, X } from "lucide-react";

interface Appointment {
  id: number;
  clientName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: "confirmed" | "waiting";
  barbershopName: string;
}

export default function ClientCancelAppointment() {
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 1,
      clientName: "João Silva",
      serviceName: "Corte + Barba",
      appointmentDate: "2026-02-05",
      appointmentTime: "14:30",
      status: "confirmed",
      barbershopName: "Estabelecimento do João",
    },
    {
      id: 2,
      clientName: "João Silva",
      serviceName: "Corte",
      appointmentDate: "2026-02-10",
      appointmentTime: "10:00",
      status: "confirmed",
      barbershopName: "Corte & Estilo",
    },
  ]);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCancelAppointment = () => {
    if (!selectedAppointment) return;

    if (!cancelReason.trim()) {
      toast.error("Por favor, informe o motivo do cancelamento");
      return;
    }

    // Remove appointment from list
    setAppointments(appointments.filter((apt) => apt.id !== selectedAppointment.id));

    toast.success("Agendamento cancelado com sucesso!");
    setIsDialogOpen(false);
    setCancelReason("");
    setSelectedAppointment(null);
  };

  const openCancelDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason("");
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold">Meus Agendamentos</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus agendamentos e cancelamentos</p>
        </div>

        {/* Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você pode cancelar agendamentos até 2 horas antes do horário marcado.
          </AlertDescription>
        </Alert>

        {/* Appointments List */}
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Você não tem agendamentos confirmados</p>
              </CardContent>
            </Card>
          ) : (
            appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {appointment.barbershopName.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{appointment.barbershopName}</h3>
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

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        {appointment.status === "confirmed" ? "Confirmado" : "Aguardando"}
                      </span>

                      <Dialog open={isDialogOpen && selectedAppointment?.id === appointment.id} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openCancelDialog(appointment)}
                            className="flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </Button>
                        </DialogTrigger>

                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cancelar Agendamento</DialogTitle>
                            <DialogDescription>
                              Tem certeza que deseja cancelar este agendamento?
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <Card className="bg-slate-50">
                              <CardContent className="pt-4">
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Estabelecimento</p>
                                    <p className="font-semibold">{selectedAppointment?.barbershopName}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Serviço</p>
                                    <p className="font-semibold">{selectedAppointment?.serviceName}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Data e Hora</p>
                                    <p className="font-semibold">
                                      {selectedAppointment &&
                                        new Date(selectedAppointment.appointmentDate).toLocaleDateString("pt-BR")}{" "}
                                      às {selectedAppointment?.appointmentTime}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <div className="space-y-2">
                              <Label htmlFor="reason">Motivo do cancelamento *</Label>
                              <Textarea
                                id="reason"
                                placeholder="Informe o motivo do cancelamento..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={4}
                              />
                            </div>

                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Ao cancelar, o estabelecimento será notificado e você poderá agendar novamente.
                              </AlertDescription>
                            </Alert>

                            <div className="flex gap-3 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                              >
                                Manter Agendamento
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleCancelAppointment}
                              >
                                Confirmar Cancelamento
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Política de Cancelamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Cancelamento Gratuito</p>
              <p className="text-muted-foreground">Cancele com até 2 horas de antecedência sem taxas</p>
            </div>
            <div>
              <p className="font-semibold">Cancelamento com Taxa</p>
              <p className="text-muted-foreground">Cancelamentos com menos de 2 horas podem ter taxa de 50% do valor</p>
            </div>
            <div>
              <p className="font-semibold">Remarcação</p>
              <p className="text-muted-foreground">Você pode remarcar seu agendamento gratuitamente a qualquer momento</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
