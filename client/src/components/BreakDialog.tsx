import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Break {
  id?: number;
  name: string;
  startTime: string;
  endTime?: string;
  daysOfWeek?: number[];
  isRecurring: boolean;
}

interface BreakDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (breakData: Break) => void;
  initialData?: Break;
  isLoading?: boolean;
}

const DAYS = [
  { label: "Segunda", value: 1 },
  { label: "Terça", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

export default function BreakDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
  isLoading = false,
}: BreakDialogProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [startTime, setStartTime] = useState(initialData?.startTime || "12:00");
  const [endTime, setEndTime] = useState(initialData?.endTime || "13:00");
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialData?.daysOfWeek || [1, 2, 3, 4, 5]
  );

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nome da pausa é obrigatório");
      return;
    }

    if (selectedDays.length === 0) {
      toast.error("Selecione pelo menos um dia");
      return;
    }

    if (startTime >= endTime) {
      toast.error("Horário de início deve ser anterior ao de término");
      return;
    }

    onSave({
      id: initialData?.id,
      name: name.trim(),
      startTime,
      endTime,
      daysOfWeek: selectedDays.sort(),
      isRecurring: true,
    });

    // Reset form
    setName("");
    setStartTime("12:00");
    setEndTime("13:00");
    setSelectedDays([1, 2, 3, 4, 5]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Pausa" : "Nova Pausa Recorrente"}
          </DialogTitle>
          <DialogDescription>
            Configure uma pausa que se repete regularmente durante a semana
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="break-name">Nome da Pausa</Label>
            <Input
              id="break-name"
              placeholder="Ex: Almoço, Café, Intervalo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Início</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">Término</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Days */}
          <div className="space-y-3">
            <Label>Dias da Semana</Label>
            <div className="grid grid-cols-2 gap-3">
              {DAYS.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`day-${day.value}`}
                    className="font-normal cursor-pointer"
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
