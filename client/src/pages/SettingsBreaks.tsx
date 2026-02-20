import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Clock, Coffee, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

const DAYS = [
  { id: 0, name: "Domingo" },
  { id: 1, name: "Segunda" },
  { id: 2, name: "Terça" },
  { id: 3, name: "Quarta" },
  { id: 4, name: "Quinta" },
  { id: 5, name: "Sexta" },
  { id: 6, name: "Sábado" },
] as const;


export default function SettingsBreaks() {
  const utils = trpc.useUtils();

  // Fetch establishments
  const { data: establishments, isLoading: loadingShops } = trpc.establishment.list.useQuery();
  const [selectedestablishmentId, setSelectedestablishmentId] = useState<string>("");

  const effectiveestablishmentId = selectedestablishmentId
    ? parseInt(selectedestablishmentId)
    : establishments?.[0]?.id ?? 0;

  // Fetch breaks
  const { data: breaksList, isLoading: loadingBreaks } = trpc.breaks.getBreaks.useQuery(
    { establishmentId: effectiveestablishmentId },
    { enabled: effectiveestablishmentId > 0 }
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    startTime: "12:00",
    endTime: "13:00",
    daysOfWeek: [1, 2, 3, 4, 5] as number[],
  });

  // Mutations
  const createBreak = trpc.breaks.createBreak.useMutation({
    onSuccess: () => {
      utils.breaks.getBreaks.invalidate();
      toast.success("Pausa criada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message || "Erro ao criar pausa"),
  });

  const updateBreak = trpc.breaks.updateBreak.useMutation({
    onSuccess: () => {
      utils.breaks.getBreaks.invalidate();
      toast.success("Pausa atualizada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar pausa"),
  });

  const deleteBreak = trpc.breaks.deleteBreak.useMutation({
    onSuccess: () => {
      utils.breaks.getBreaks.invalidate();
      toast.success("Pausa removida com sucesso!");
    },
    onError: (err) => toast.error(err.message || "Erro ao remover pausa"),
  });

  const resetForm = () => {
    setFormData({ name: "", startTime: "12:00", endTime: "13:00", daysOfWeek: [1, 2, 3, 4, 5] });
    setEditingId(null);
  };

  const toggleDay = (dayId: number) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayId)
        ? prev.daysOfWeek.filter((d) => d !== dayId)
        : [...prev.daysOfWeek, dayId],
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Digite o nome da pausa");
      return;
    }

    if (editingId) {
      updateBreak.mutate({
        id: editingId,
        establishmentId: effectiveestablishmentId,
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        daysOfWeek: formData.daysOfWeek,
      });
    } else {
      createBreak.mutate({
        establishmentId: effectiveestablishmentId,
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        daysOfWeek: formData.daysOfWeek,
        isRecurring: true,
      });
    }
  };

  const handleEdit = (breakItem: any) => {
    setFormData({
      name: breakItem.name,
      startTime: breakItem.startTime,
      endTime: breakItem.endTime,
      daysOfWeek: breakItem.daysOfWeek || [],
    });
    setEditingId(breakItem.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteBreak.mutate({ id, establishmentId: effectiveestablishmentId });
  };

  const isMutating = createBreak.isPending || updateBreak.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Pausas</h1>
            <p className="text-muted-foreground mt-2">Configure intervalos e pausas dos profissionais</p>
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
                  Você precisa criar um estabelecimento antes de adicionar pausas.
                  <a href="/settings" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                    Ir para Configurações
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Break */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              disabled={loadingShops || !effectiveestablishmentId}
            >
              <Plus className="w-4 h-4" />
              Nova Pausa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Pausa" : "Nova Pausa"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Atualize os dados da pausa" : "Configure uma nova pausa recorrente"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="break-name">Nome *</Label>
                <Input
                  id="break-name"
                  placeholder="Ex: Almoço"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dias da Semana</Label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${formData.daysOfWeek.includes(day.id)
                        ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                        : "bg-slate-100 text-slate-500 border-2 border-slate-200"
                        }`}
                    >
                      {day.name.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={isMutating}>
                  {isMutating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                  ) : editingId ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Breaks List */}
        <div className="space-y-4">
          {loadingBreaks ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Carregando pausas...</p>
              </CardContent>
            </Card>
          ) : !breaksList?.length ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Coffee className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhuma pausa cadastrada</p>
                <p className="text-sm text-muted-foreground mt-1">Crie pausas para intervalos como almoço, lanche, etc.</p>
              </CardContent>
            </Card>
          ) : (
            breaksList.map((breakItem) => (
              <Card key={breakItem.id} className="hover:shadow-md transition">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Coffee className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{breakItem.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            {breakItem.startTime} - {breakItem.endTime}
                          </div>
                          <div className="flex gap-1 mt-2">
                            {DAYS.map((day) => (
                              <span
                                key={day.id}
                                className={`text-xs px-2 py-0.5 rounded ${breakItem.daysOfWeek?.includes(day.id)
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-400"
                                  }`}
                              >
                                {day.name.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(breakItem)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(breakItem.id)}
                        disabled={deleteBreak.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info Box */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-orange-900 mb-2">☕ Sobre Pausas</h4>
            <p className="text-sm text-orange-800">
              As pausas são bloqueios recorrentes no horário de cada profissional. Durante uma pausa, nenhum agendamento pode ser criado nesse horário.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
