import { useState } from "react";
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
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface CreateQueueAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  onSuccess?: () => void;
}

export default function CreateQueueAppointmentModal({
  open,
  onOpenChange,
  establishmentId,
  onSuccess,
}: CreateQueueAppointmentModalProps) {
  const [formData, setFormData] = useState({
    clientId: "",
    serviceId: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch services
  const { data: services = [] } = trpc.service.list.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  // TODO: Fetch clients from database when client router is available
  const clients: any[] = [];

  // Add to queue mutation
  const addToQueueMutation = trpc.appointment.addToQueue.useMutation({
    onSuccess: () => {
      toast.success("Cliente adicionado à fila com sucesso!");
      setFormData({ clientId: "", serviceId: "", notes: "" });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      setError(error.message || "Erro ao adicionar à fila");
      toast.error(error.message || "Erro ao adicionar à fila");
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation
    if (!formData.clientId) {
      setError("Selecione um cliente");
      setIsSubmitting(false);
      return;
    }

    if (!formData.serviceId) {
      setError("Selecione um serviço");
      setIsSubmitting(false);
      return;
    }

    try {
      await addToQueueMutation.mutateAsync({
        establishmentId,
        clientId: parseInt(formData.clientId),
        serviceId: parseInt(formData.serviceId),
        notes: formData.notes || undefined,
      });
    } catch (error) {
      console.error("Error adding to queue:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar à Fila</DialogTitle>
          <DialogDescription>
            Adicione um novo cliente à fila de espera
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Input
              id="client"
              placeholder="ID do cliente"
              type="number"
              value={formData.clientId}
              onChange={(e) => handleInputChange("clientId", e.target.value)}
              required
            />
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">Serviço *</Label>
            <Select
              value={formData.serviceId}
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input
              id="notes"
              placeholder="Ex: Cliente preferência de profissional"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
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
                  Adicionando...
                </>
              ) : (
                "Adicionar à Fila"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
