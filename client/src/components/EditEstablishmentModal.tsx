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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle } from "lucide-react";

interface EditEstablishmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishment: any;
  onSuccess?: () => void;
}

export default function EditEstablishmentModal({
  open,
  onOpenChange,
  establishment,
  onSuccess,
}: EditEstablishmentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    description: "",
    operatingMode: "both" as "queue" | "scheduled" | "both",
    openTime: "",
    closeTime: "",
    closedDays: [] as number[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when establishment changes
  useEffect(() => {
    if (establishment && open) {
      setFormData({
        name: establishment.name || "",
        phone: establishment.phone || "",
        whatsapp: establishment.whatsapp || "",
        address: establishment.address || "",
        city: establishment.city || "",
        state: establishment.state || "",
        zipCode: establishment.zipCode || "",
        description: establishment.description || "",
        operatingMode: establishment.operatingMode || "both",
        openTime: establishment.openTime || "",
        closeTime: establishment.closeTime || "",
        closedDays: establishment.closedDays || [],
      });
      setError(null);
    }
  }, [establishment, open]);

  // Update barbershop mutation
  const updateMutation = trpc.establishment.update.useMutation({
    onSuccess: () => {
      toast.success("Informações do estabelecimento atualizadas com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      const errorMessage = error.message || "Erro ao atualizar estabelecimento";
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleClosedDayToggle = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      closedDays: prev.closedDays.includes(day)
        ? prev.closedDays.filter((d) => d !== day)
        : [...prev.closedDays, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Nome do estabelecimento é obrigatório");
      setIsSubmitting(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError("Telefone é obrigatório");
      setIsSubmitting(false);
      return;
    }

    if (!formData.whatsapp.trim()) {
      setError("WhatsApp é obrigatório");
      setIsSubmitting(false);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        establishmentId: establishment.id,
        ...formData,
      });
    } catch (error) {
      console.error("Error updating establishment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysOfWeek = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Segunda" },
    { value: 2, label: "Terça" },
    { value: 3, label: "Quarta" },
    { value: 4, label: "Quinta" },
    { value: 5, label: "Sexta" },
    { value: 6, label: "Sábado" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Informações do Estabelecimento</DialogTitle>
          <DialogDescription>
            Atualize os dados do seu estabelecimento
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Informações Básicas</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Estabelecimento *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Minha Empresa"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operatingMode">Modo de Operação *</Label>
                <Select
                  value={formData.operatingMode}
                  onValueChange={(value) =>
                    handleInputChange(
                      "operatingMode",
                      value as "queue" | "scheduled" | "both"
                    )
                  }
                >
                  <SelectTrigger id="operatingMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="queue">Fila Virtual</SelectItem>
                    <SelectItem value="scheduled">Horário Marcado</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva seu estabelecimento..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Contato</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  placeholder="Ex: (21) 3333-3333"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  placeholder="Ex: (21) 99999-9999"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    handleInputChange("whatsapp", e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Endereço</h3>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                placeholder="Ex: Rua das Flores, 123"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  placeholder="Ex: Rio de Janeiro"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  placeholder="Ex: RJ"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) =>
                    handleInputChange("state", e.target.value.toUpperCase())
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  placeholder="Ex: 20000-000"
                  value={formData.zipCode}
                  onChange={(e) =>
                    handleInputChange("zipCode", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Horário de Funcionamento</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openTime">Horário de Abertura</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={formData.openTime}
                  onChange={(e) =>
                    handleInputChange("openTime", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closeTime">Horário de Fechamento</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) =>
                    handleInputChange("closeTime", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dias Fechados</Label>
              <div className="grid grid-cols-2 gap-3">
                {daysOfWeek.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.closedDays.includes(day.value)}
                      onChange={() => handleClosedDayToggle(day.value)}
                      className="rounded"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 justify-end">
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
