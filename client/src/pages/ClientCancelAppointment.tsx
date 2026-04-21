import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertCircle, Calendar, Clock, Scissors, CheckCircle2, Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ClientCancelAppointment() {
  const params = new URLSearchParams(window.location.search);
  const appointmentId = parseInt(params.get("id") ?? "0");
  const clientPhone = params.get("phone") ?? "";

  const [cancelReason, setCancelReason] = useState("");
  const [cancelled, setCancelled] = useState(false);

  const { data: appointment, isLoading, error } = trpc.appointments.getByIdPublic.useQuery(
    { appointmentId, clientPhone },
    { enabled: appointmentId > 0 && clientPhone.length > 0, retry: false }
  );

  const cancelMutation = trpc.appointments.cancelByClient.useMutation({
    onSuccess: () => {
      setCancelled(true);
      toast.success("Agendamento cancelado com sucesso!");
    },
    onError: (err) => toast.error(err.message || "Erro ao cancelar agendamento"),
  });

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast.error("Por favor, informe o motivo do cancelamento");
      return;
    }
    cancelMutation.mutate({ appointmentId, clientPhone, reason: cancelReason });
  };

  if (!appointmentId || !clientPhone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="font-semibold">Link inválido</p>
            <p className="text-sm text-muted-foreground mt-1">
              O link de cancelamento está incompleto. Verifique o link no seu WhatsApp.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="font-semibold">Agendamento não encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Não foi possível localizar o agendamento. Verifique o link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cancelled || appointment.status === "cancelled") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-semibold text-lg">Agendamento Cancelado</p>
            <p className="text-sm text-muted-foreground">
              Seu agendamento foi cancelado com sucesso. Obrigado por avisar!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scheduledDate = appointment.scheduledTime ? new Date(appointment.scheduledTime) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Cancelar Agendamento</h1>
          <p className="text-muted-foreground mt-2">Confirme o cancelamento do seu agendamento</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cancele com pelo menos 2 horas de antecedência para evitar taxas.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {(appointment.establishmentName ?? "E").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{appointment.establishmentName}</p>
                <p className="text-sm text-muted-foreground">Estabelecimento</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {appointment.serviceName && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                  <Scissors className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{appointment.serviceName}</p>
                    <p className="text-muted-foreground text-xs">Serviço</p>
                  </div>
                </div>
              )}
              {scheduledDate && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{scheduledDate.toLocaleDateString("pt-BR")}</p>
                    <p className="text-muted-foreground text-xs">Data</p>
                  </div>
                </div>
              )}
              {scheduledDate && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {scheduledDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-muted-foreground text-xs">Horário</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
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
            <Button
              variant="destructive"
              className="w-full flex items-center gap-2"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Confirmar Cancelamento
            </Button>
          </CardContent>
        </Card>

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
              <p className="text-muted-foreground">Cancelamentos com menos de 2 horas podem ter taxa de 50%</p>
            </div>
            <div>
              <p className="font-semibold">Remarcação</p>
              <p className="text-muted-foreground">Você pode remarcar gratuitamente a qualquer momento</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
