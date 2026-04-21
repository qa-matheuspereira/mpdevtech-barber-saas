import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

const DEFAULT_FORM = {
  name: "",
  startTime: "12:00",
  endTime: "13:00",
  daysOfWeek: [1, 2, 3, 4, 5] as number[],
  isRecurring: true,
};

export default function BarberBreaksManagement() {
  const utils = trpc.useUtils();

  const [selectedEstablishment, setSelectedEstablishment] = useState<string>("");
  const [selectedBarber, setSelectedBarber] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBreakId, setEditingBreakId] = useState<number | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  const { data: establishments, isLoading: loadingShops } = trpc.establishment.list.useQuery();

  const effectiveEstId = selectedEstablishment
    ? parseInt(selectedEstablishment)
    : establishments?.[0]?.id ?? 0;

  const { data: barbers, isLoading: loadingBarbers } = trpc.barbers.list.useQuery(
    { establishmentId: effectiveEstId },
    { enabled: effectiveEstId > 0 }
  );

  const effectiveBarberId = selectedBarber
    ? parseInt(selectedBarber)
    : barbers?.[0]?.id ?? 0;

  const { data: breaks, isLoading: loadingBreaks } = trpc.barberBreaks.listForBarber.useQuery(
    { barberId: effectiveBarberId, establishmentId: effectiveEstId },
    { enabled: effectiveBarberId > 0 && effectiveEstId > 0 }
  );

  const createBreak = trpc.barberBreaks.create.useMutation({
    onSuccess: () => {
      utils.barberBreaks.listForBarber.invalidate({ barberId: effectiveBarberId, establishmentId: effectiveEstId });
      toast.success("Pausa criada com sucesso!");
      closeDialog();
    },
    onError: (err) => toast.error(err.message || "Erro ao criar pausa"),
  });

  const updateBreak = trpc.barberBreaks.update.useMutation({
    onSuccess: () => {
      utils.barberBreaks.listForBarber.invalidate({ barberId: effectiveBarberId, establishmentId: effectiveEstId });
      toast.success("Pausa atualizada com sucesso!");
      closeDialog();
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar pausa"),
  });

  const deleteBreak = trpc.barberBreaks.delete.useMutation({
    onSuccess: () => {
      utils.barberBreaks.listForBarber.invalidate({ barberId: effectiveBarberId, establishmentId: effectiveEstId });
      toast.success("Pausa removida com sucesso!");
    },
    onError: (err) => toast.error(err.message || "Erro ao remover pausa"),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingBreakId(null);
    setFormData(DEFAULT_FORM);
  };

  const handleSaveBreak = () => {
    if (!formData.name.trim()) {
      toast.error("Nome da pausa é obrigatório");
      return;
    }
    const [startHour, startMin] = formData.startTime.split(":").map(Number);
    const [endHour, endMin] = formData.endTime.split(":").map(Number);
    if (startHour * 60 + startMin >= endHour * 60 + endMin) {
      toast.error("Hora de início deve ser anterior à hora de término");
      return;
    }
    if (formData.daysOfWeek.length === 0) {
      toast.error("Selecione pelo menos um dia da semana");
      return;
    }

    if (editingBreakId) {
      updateBreak.mutate({
        breakId: editingBreakId,
        barberId: effectiveBarberId,
        establishmentId: effectiveEstId,
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        daysOfWeek: formData.daysOfWeek,
        isRecurring: formData.isRecurring,
      });
    } else {
      createBreak.mutate({
        barberId: effectiveBarberId,
        establishmentId: effectiveEstId,
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        daysOfWeek: formData.daysOfWeek,
        isRecurring: formData.isRecurring,
      });
    }
  };

  const handleEditBreak = (b: any) => {
    setEditingBreakId(b.id);
    setFormData({
      name: b.name,
      startTime: b.startTime,
      endTime: b.endTime ?? "13:00",
      daysOfWeek: b.daysOfWeek ?? [],
      isRecurring: b.isRecurring ?? true,
    });
    setIsDialogOpen(true);
  };

  const getDaysLabel = (days: number[]) =>
    days.map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label.substring(0, 3)).join(", ");

  const selectedBarberName = barbers?.find((b) => b.id === effectiveBarberId)?.name ?? "";
  const isSaving = createBreak.isPending || updateBreak.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Pausas por Profissional</h1>
            <p className="text-muted-foreground mt-2">Gerencie as pausas e intervalos de cada profissional</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div>
              <Label htmlFor="est-select" className="block mb-2">Estabelecimento</Label>
              <Select
                value={selectedEstablishment || (establishments?.[0]?.id.toString() ?? "")}
                onValueChange={setSelectedEstablishment}
              >
                <SelectTrigger id="est-select" className="w-56">
                  <SelectValue placeholder={loadingShops ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {(establishments ?? []).map((shop) => (
                    <SelectItem key={shop.id} value={shop.id.toString()}>{shop.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="barber-select" className="block mb-2">Profissional</Label>
              <Select
                value={selectedBarber || (barbers?.[0]?.id.toString() ?? "")}
                onValueChange={setSelectedBarber}
                disabled={!effectiveEstId || loadingBarbers}
              >
                <SelectTrigger id="barber-select" className="w-56">
                  <SelectValue placeholder={loadingBarbers ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {(barbers ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button
          onClick={() => { setFormData(DEFAULT_FORM); setEditingBreakId(null); setIsDialogOpen(true); }}
          disabled={!effectiveBarberId}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Pausa
        </Button>

        <div className="space-y-3">
          {loadingBreaks ? (
            <Card><CardContent className="pt-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></CardContent></Card>
          ) : !effectiveBarberId ? (
            <Card><CardContent className="pt-6 text-center"><p className="text-muted-foreground">Selecione um profissional para ver as pausas</p></CardContent></Card>
          ) : (breaks ?? []).length === 0 ? (
            <Card><CardContent className="pt-6 text-center"><p className="text-muted-foreground">Nenhuma pausa configurada para este profissional</p></CardContent></Card>
          ) : (
            (breaks ?? []).map((b) => (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{b.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>{b.startTime} - {b.endTime}</span>
                          <span>•</span>
                          <span>{getDaysLabel(b.daysOfWeek ?? [])}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.isRecurring && <Badge variant="secondary">Recorrente</Badge>}
                      <Button variant="ghost" size="sm" onClick={() => handleEditBreak(b)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBreak.mutate({ breakId: b.id, barberId: effectiveBarberId, establishmentId: effectiveEstId })}
                        disabled={deleteBreak.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader><CardTitle>Dicas</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• As pausas recorrentes se repetem automaticamente nos dias selecionados</p>
            <p>• Clientes não conseguirão agendar durante as pausas configuradas</p>
            <p>• Você pode ter múltiplas pausas no mesmo dia</p>
            <p>• Cada profissional pode ter suas próprias pausas independentes</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBreakId ? "Editar Pausa" : "Nova Pausa"}</DialogTitle>
            <DialogDescription>
              Pausa para {selectedBarberName || "profissional selecionado"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="break-name">Nome da Pausa *</Label>
              <Input
                id="break-name"
                placeholder="Ex: Almoço, Café, etc"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Início *</Label>
                <Input id="start-time" type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="end-time">Término *</Label>
                <Input id="end-time" type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Dias da Semana *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={formData.daysOfWeek.includes(day.value)}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          daysOfWeek: checked
                            ? [...formData.daysOfWeek, day.value].sort()
                            : formData.daysOfWeek.filter((d) => d !== day.value),
                        });
                      }}
                    />
                    <label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">{day.label}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked as boolean })}
              />
              <label htmlFor="recurring" className="text-sm cursor-pointer">Pausa Recorrente</label>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={closeDialog} disabled={isSaving}>Cancelar</Button>
              <Button onClick={handleSaveBreak} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingBreakId ? "Atualizar" : "Criar"} Pausa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
