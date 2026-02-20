import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EditAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  establishmentId: number;
  onSuccess?: () => void;
}

export default function EditAppointmentModal({
  open,
  onOpenChange,
  appointment,
  establishmentId,
  onSuccess,
}: EditAppointmentModalProps) {
  const [formData, setFormData] = useState({
    clientId: appointment?.clientId || "",
    serviceId: appointment?.serviceId || "",
    scheduledTime: appointment?.scheduledTime ? format(new Date(appointment.scheduledTime), "yyyy-MM-dd'T'HH:mm") : "",
    durationMinutes: appointment?.durationMinutes || 60,
    barberId: appointment?.barberId || "",
    notes: appointment?.notes || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Fetch clients
  const { data: clients = [] } = trpc.customer.list.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  // Fetch services
  const { data: services = [] } = trpc.service.list.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  // Fetch barbers
  const { data: barbers = [] } = trpc.barbers.list.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  // Check availability query

  // Update appointment mutation
  const updateMutation = trpc.appointment.updateAppointment.useMutation({
    onSuccess: () => {
      toast.success("Agendamento atualizado com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      if (error.data?.code === "CONFLICT") {
        setConflictError(error.message);
      } else {
        toast.error(error.message || "Erro ao atualizar agendamento");
      }
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setConflictError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setConflictError(null);

    try {
      // Parse the datetime string
      const scheduledDate = new Date(formData.scheduledTime);

      // Note: Availability check will be done on server side during update

      // Update appointment
      await updateMutation.mutateAsync({
        appointmentId: appointment.id,
        clientId: formData.clientId ? parseInt(formData.clientId) : undefined,
        serviceId: formData.serviceId ? parseInt(formData.serviceId) : undefined,
        scheduledTime: scheduledDate,
        durationMinutes: formData.durationMinutes,
        barberId: formData.barberId ? parseInt(formData.barberId) : undefined,
        notes: formData.notes || undefined,
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do agendamento de {appointment?.client?.name || "cliente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select
              value={formData.clientId.toString()}
              onValueChange={(value) => handleInputChange("clientId", value)}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">Serviço</Label>
            <Select
              value={formData.serviceId.toString()}
              onValueChange={(value) => handleInputChange("serviceId", value)}
            >
              <SelectTrigger id="service">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service: any) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} ({service.durationMinutes}min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="space-y-2">
            <Label htmlFor="datetime">Data e Hora</Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => handleInputChange("scheduledTime", e.target.value)}
              required
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={formData.durationMinutes}
              onChange={(e) => handleInputChange("durationMinutes", parseInt(e.target.value))}
              required
            />
          </div>

          {/* Barber Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="barber">Profissional (Opcional)</Label>
            <Select
              value={formData.barberId.toString()}
              onValueChange={(value) => handleInputChange("barberId", value)}
            >
              <SelectTrigger id="barber">
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer profissional</SelectItem>
                {barbers.map((barber: any) => (
                  <SelectItem key={barber.id} value={barber.id.toString()}>
                    {barber.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Adicione notas sobre o agendamento..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          {/* Conflict Error Alert */}
          {conflictError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{conflictError}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
