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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TimeBlock {
  id?: number;
  name: string;
  startTime: string;
  endTime?: string;
  date: string;
  blockType: "maintenance" | "absence" | "closed" | "custom";
}

interface TimeBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (blockData: TimeBlock) => void;
  initialData?: TimeBlock;
  selectedDate?: Date;
  isLoading?: boolean;
}

const BLOCK_TYPES = [
  { label: "Manutenção", value: "maintenance" },
  { label: "Ausência", value: "absence" },
  { label: "Fechado", value: "closed" },
  { label: "Personalizado", value: "custom" },
];

export default function TimeBlockDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
  selectedDate,
  isLoading = false,
}: TimeBlockDialogProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [blockType, setBlockType] = useState<string>(
    initialData?.blockType || "maintenance"
  );
  const [date, setDate] = useState(
    initialData?.date || selectedDate?.toISOString().split("T")[0] || ""
  );
  const [startTime, setStartTime] = useState(initialData?.startTime || "09:00");
  const [endTime, setEndTime] = useState(initialData?.endTime || "18:00");
  const [isAllDay, setIsAllDay] = useState(!initialData?.endTime);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nome do bloqueio é obrigatório");
      return;
    }

    if (!date) {
      toast.error("Data é obrigatória");
      return;
    }

    if (!isAllDay && startTime >= endTime) {
      toast.error("Horário de início deve ser anterior ao de término");
      return;
    }

    onSave({
      id: initialData?.id,
      name: name.trim(),
      startTime,
      endTime: isAllDay ? undefined : endTime,
      date,
      blockType: blockType as "maintenance" | "absence" | "closed" | "custom",
    });

    // Reset form
    setName("");
    setBlockType("maintenance");
    setDate("");
    setStartTime("09:00");
    setEndTime("18:00");
    setIsAllDay(false);
    onOpenChange(false);
  };

  const getBlockTypeLabel = (type: string) => {
    return BLOCK_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Bloqueio" : "Novo Bloqueio de Tempo"}
          </DialogTitle>
          <DialogDescription>
            Configure um período onde você não está disponível para agendamentos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="block-name">Descrição</Label>
            <Input
              id="block-name"
              placeholder="Ex: Manutenção, Férias, Reunião"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="block-type">Tipo de Bloqueio</Label>
            <Select value={blockType} onValueChange={setBlockType} disabled={isLoading}>
              <SelectTrigger id="block-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="block-date">Data</Label>
            <Input
              id="block-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="all-day"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="all-day" className="font-normal cursor-pointer">
              Dia todo
            </Label>
          </div>

          {/* Times */}
          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="block-start">Início</Label>
                <Input
                  id="block-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-end">Término</Label>
                <Input
                  id="block-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
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
