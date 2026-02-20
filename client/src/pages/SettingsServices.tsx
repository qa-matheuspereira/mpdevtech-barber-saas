import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, DollarSign, Clock, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function SettingsServices() {
  const utils = trpc.useUtils();

  // Fetch establishments from API
  const { data: establishments, isLoading: loadingShops } = trpc.establishment.list.useQuery();
  const [selectedestablishmentId, setSelectedestablishmentId] = useState<string>("");

  const effectiveestablishmentId = selectedestablishmentId
    ? parseInt(selectedestablishmentId)
    : establishments?.[0]?.id ?? 0;

  // Fetch services from API
  const { data: servicesList, isLoading: loadingServices } = trpc.services.list.useQuery(
    { establishmentId: effectiveestablishmentId },
    { enabled: effectiveestablishmentId > 0 }
  );

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    durationMinutes: 30,
    price: "",
  });

  // Mutations
  const createService = trpc.services.create.useMutation({
    onSuccess: () => {
      utils.services.list.invalidate();
      toast.success("Serviço criado com sucesso!");
      setIsCreating(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message || "Erro ao criar serviço"),
  });

  const updateService = trpc.services.update.useMutation({
    onSuccess: () => {
      utils.services.list.invalidate();
      toast.success("Serviço atualizado com sucesso!");
      setIsCreating(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar serviço"),
  });

  const deleteService = trpc.services.delete.useMutation({
    onSuccess: () => {
      utils.services.list.invalidate();
      toast.success("Serviço removido com sucesso!");
    },
    onError: (err) => toast.error(err.message || "Erro ao remover serviço"),
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", durationMinutes: 30, price: "" });
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) {
      toast.error("Preencha nome e preço");
      return;
    }

    // Ensure price format matches "XX.XX"
    const priceFormatted = parseFloat(formData.price).toFixed(2);

    if (editingId) {
      updateService.mutate({
        id: editingId,
        establishmentId: effectiveestablishmentId,
        name: formData.name,
        description: formData.description || undefined,
        durationMinutes: formData.durationMinutes,
        price: priceFormatted,
      });
    } else {
      createService.mutate({
        establishmentId: effectiveestablishmentId,
        name: formData.name,
        description: formData.description || undefined,
        durationMinutes: formData.durationMinutes,
        price: priceFormatted,
      });
    }
  };

  const handleEdit = (service: any) => {
    setFormData({
      name: service.name,
      description: service.description || "",
      durationMinutes: service.durationMinutes,
      price: service.price,
    });
    setEditingId(service.id);
    setIsCreating(true);
  };

  const handleDelete = (id: number) => {
    deleteService.mutate({ id, establishmentId: effectiveestablishmentId });
  };

  const isMutating = createService.isPending || updateService.isPending;
  const activeServices = servicesList?.filter(s => s.isActive) ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Serviços</h1>
            <p className="text-muted-foreground mt-2">Configure os serviços oferecidos pelo seu estabelecimento</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barbershop-select">Estabelecimento</Label>
            {loadingShops ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <Select
                value={selectedestablishmentId || (establishments?.[0]?.id?.toString() ?? "")}
                onValueChange={setSelectedestablishmentId}
              >
                <SelectTrigger id="barbershop-select" className="w-64">
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

        {!loadingShops && (!establishments || establishments.length === 0) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Você precisa criar um estabelecimento antes de adicionar serviços.
                  <a href="/settings" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                    Ir para Configurações
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Service Button */}
        <Dialog open={isCreating} onOpenChange={(open) => { setIsCreating(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              disabled={loadingShops || !effectiveestablishmentId}
            >
              <Plus className="w-4 h-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Atualize os dados do serviço" : "Preencha os dados do novo serviço"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Corte de Cabelo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o serviço"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 5 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => { setIsCreating(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={isMutating}>
                  {isMutating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                  ) : editingId ? "Atualizar Serviço" : "Criar Serviço"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Services List */}
        <div className="space-y-4">
          {loadingServices ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Carregando serviços...</p>
              </CardContent>
            </Card>
          ) : activeServices.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Nenhum serviço cadastrado</p>
              </CardContent>
            </Card>
          ) : (
            activeServices.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      )}
                      <div className="flex gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4" />
                          {service.durationMinutes} minutos
                        </div>
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          R$ {parseFloat(service.price).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(service)} className="flex items-center gap-2">
                        <Edit2 className="w-4 h-4" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                        disabled={deleteService.isPending}
                      >
                        <Trash2 className="w-4 h-4" /> Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Dica</h4>
            <p className="text-sm text-blue-800">
              A duração do serviço é importante para calcular automaticamente os horários disponíveis no agendamento.
              Certifique-se de definir durações realistas para evitar conflitos de agendamento.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
