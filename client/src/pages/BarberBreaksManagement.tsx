import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface BarberBreak {
  id: number;
  barberId: number;
  barberName: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  isRecurring: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

export default function BarberBreaksManagement() {
  const [selectedBarber, setSelectedBarber] = useState("1");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBreak, setEditingBreak] = useState<BarberBreak | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    startTime: "12:00",
    endTime: "13:00",
    daysOfWeek: [1, 2, 3, 4, 5],
    isRecurring: true,
  });

  // Mock data
  const barbers = [
    { id: "1", name: "João Silva" },
    { id: "2", name: "Carlos Santos" },
    { id: "3", name: "Pedro Oliveira" },
  ];

  const breaks: BarberBreak[] = [
    {
      id: 1,
      barberId: 1,
      barberName: "João Silva",
      name: "Almoço",
      startTime: "12:00",
      endTime: "13:00",
      daysOfWeek: [1, 2, 3, 4, 5],
      isRecurring: true,
    },
    {
      id: 2,
      barberId: 1,
      barberName: "João Silva",
      name: "Café",
      startTime: "15:30",
      endTime: "16:00",
      daysOfWeek: [1, 2, 3, 4, 5],
      isRecurring: true,
    },
    {
      id: 3,
      barberId: 2,
      barberName: "Carlos Santos",
      name: "Almoço",
      startTime: "13:00",
      endTime: "14:00",
      daysOfWeek: [1, 2, 3, 4, 5],
      isRecurring: true,
    },
  ];

  const barberBreaks = breaks.filter((b) => b.barberId === parseInt(selectedBarber));

  const handleSaveBreak = () => {
    if (!formData.name.trim()) {
      toast.error("Nome da pausa é obrigatório");
      return;
    }

    const [startHour, startMin] = formData.startTime.split(":").map(Number);
    const [endHour, endMin] = formData.endTime.split(":").map(Number);
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    if (startTotalMin >= endTotalMin) {
      toast.error("Hora de início deve ser anterior à hora de término");
      return;
    }

    if (formData.daysOfWeek.length === 0) {
      toast.error("Selecione pelo menos um dia da semana");
      return;
    }

    if (editingBreak) {
      toast.success("Pausa atualizada com sucesso!");
    } else {
      toast.success("Pausa criada com sucesso!");
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      startTime: "12:00",
      endTime: "13:00",
      daysOfWeek: [1, 2, 3, 4, 5],
      isRecurring: true,
    });
    setEditingBreak(null);
  };

  const handleEditBreak = (breakItem: BarberBreak) => {
    setEditingBreak(breakItem);
    setFormData({
      name: breakItem.name,
      startTime: breakItem.startTime,
      endTime: breakItem.endTime,
      daysOfWeek: breakItem.daysOfWeek,
      isRecurring: breakItem.isRecurring,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteBreak = (breakId: number) => {
    toast.success("Pausa removida com sucesso!");
  };

  const getDaysLabel = (days: number[]) => {
    const labels = days
      .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label.substring(0, 3))
      .join(", ");
    return labels;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pausas por Profissional</h1>
            <p className="text-muted-foreground mt-2">Gerencie as pausas e intervalos de cada profissional</p>
          </div>
          <div>
            <Label htmlFor="barber-select" className="block mb-2">
              Selecione o Profissional
            </Label>
            <select
              id="barber-select"
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-64 px-3 py-2 border rounded-lg"
            >
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Break Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Pausa
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingBreak ? "Editar Pausa" : "Nova Pausa"}</DialogTitle>
              <DialogDescription>
                Defina uma pausa recorrente para {barbers.find((b) => b.id === selectedBarber)?.name}
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
                  <Input
                    id="start-time"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">Término *</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="mt-1"
                  />
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
                          if (checked) {
                            setFormData({
                              ...formData,
                              daysOfWeek: [...formData.daysOfWeek, day.value].sort(),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              daysOfWeek: formData.daysOfWeek.filter((d) => d !== day.value),
                            });
                          }
                        }}
                      />
                      <label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRecurring: checked as boolean })
                  }
                />
                <label htmlFor="recurring" className="text-sm cursor-pointer">
                  Pausa Recorrente
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveBreak} className="bg-blue-600 hover:bg-blue-700">
                  {editingBreak ? "Atualizar" : "Criar"} Pausa
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Breaks List */}
        <div className="space-y-3">
          {barberBreaks.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Nenhuma pausa configurada para este profissional</p>
              </CardContent>
            </Card>
          ) : (
            barberBreaks.map((breakItem) => (
              <Card key={breakItem.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{breakItem.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>
                              {breakItem.startTime} - {breakItem.endTime}
                            </span>
                            <span>•</span>
                            <span>{getDaysLabel(breakItem.daysOfWeek)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {breakItem.isRecurring && (
                        <Badge variant="secondary">Recorrente</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBreak(breakItem)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBreak(breakItem.id)}
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

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Dicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• As pausas recorrentes se repetem automaticamente nos dias selecionados</p>
            <p>• Clientes não conseguirão agendar durante as pausas configuradas</p>
            <p>• Você pode ter múltiplas pausas no mesmo dia</p>
            <p>• Cada profissional pode ter suas próprias pausas independentes</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
