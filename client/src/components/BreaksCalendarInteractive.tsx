import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BreakDialog from "./BreakDialog";
import TimeBlockDialog from "./TimeBlockDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface BreaksCalendarInteractiveProps {
  establishmentId: number;
}

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function BreaksCalendarInteractive({ establishmentId }: BreaksCalendarInteractiveProps) {
  const utils = trpc.useUtils();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [breakDialogOpen, setBreakDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBreak, setEditingBreak] = useState<any>(undefined);
  const [editingBlock, setEditingBlock] = useState<any>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "break" | "block"; id: number } | null>(null);

  const enabled = establishmentId > 0;

  const { data: breaksData = [], isLoading: loadingBreaks } = trpc.breaks.getBreaks.useQuery(
    { establishmentId },
    { enabled }
  );

  const { data: blocksData = [], isLoading: loadingBlocks } = trpc.breaks.getTimeBlocks.useQuery(
    { establishmentId },
    { enabled }
  );

  const createBreak = trpc.breaks.createBreak.useMutation({
    onSuccess: () => {
      utils.breaks.getBreaks.invalidate({ establishmentId });
      toast.success("Pausa criada");
      setBreakDialogOpen(false);
      setEditingBreak(undefined);
    },
    onError: (err) => toast.error(err.message || "Erro ao criar pausa"),
  });

  const updateBreak = trpc.breaks.updateBreak.useMutation({
    onSuccess: () => {
      utils.breaks.getBreaks.invalidate({ establishmentId });
      toast.success("Pausa atualizada");
      setBreakDialogOpen(false);
      setEditingBreak(undefined);
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar pausa"),
  });

  const deleteBreak = trpc.breaks.deleteBreak.useMutation({
    onSuccess: () => {
      utils.breaks.getBreaks.invalidate({ establishmentId });
      toast.success("Pausa removida");
      setDeleteConfirm(null);
    },
    onError: (err) => toast.error(err.message || "Erro ao remover pausa"),
  });

  const createBlock = trpc.breaks.createTimeBlock.useMutation({
    onSuccess: () => {
      utils.breaks.getTimeBlocks.invalidate({ establishmentId });
      toast.success("Bloqueio criado");
      setBlockDialogOpen(false);
      setEditingBlock(undefined);
    },
    onError: (err) => toast.error(err.message || "Erro ao criar bloqueio"),
  });

  const updateBlock = trpc.breaks.updateTimeBlock.useMutation({
    onSuccess: () => {
      utils.breaks.getTimeBlocks.invalidate({ establishmentId });
      toast.success("Bloqueio atualizado");
      setBlockDialogOpen(false);
      setEditingBlock(undefined);
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar bloqueio"),
  });

  const deleteBlock = trpc.breaks.deleteTimeBlock.useMutation({
    onSuccess: () => {
      utils.breaks.getTimeBlocks.invalidate({ establishmentId });
      toast.success("Bloqueio removido");
      setDeleteConfirm(null);
    },
    onError: (err) => toast.error(err.message || "Erro ao remover bloqueio"),
  });

  const handleBreakSave = (breakData: any) => {
    if (editingBreak?.id) {
      updateBreak.mutate({ id: editingBreak.id, establishmentId, ...breakData });
    } else {
      createBreak.mutate({ establishmentId, ...breakData });
    }
  };

  const handleBlockSave = (blockData: any) => {
    const startDateTime = new Date(`${blockData.date}T${blockData.startTime}:00`);
    const endTime = blockData.endTime || "23:59";
    const endDateTime = new Date(`${blockData.date}T${endTime}:00`);

    if (editingBlock?.id) {
      updateBlock.mutate({
        id: editingBlock.id,
        establishmentId,
        title: blockData.name,
        blockType: blockData.blockType,
        startTime: startDateTime,
        endTime: endDateTime,
      });
    } else {
      createBlock.mutate({
        establishmentId,
        title: blockData.name,
        blockType: blockData.blockType,
        startTime: startDateTime,
        endTime: endDateTime,
        isRecurring: false,
      });
    }
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "break") {
      deleteBreak.mutate({ id: deleteConfirm.id, establishmentId });
    } else {
      deleteBlock.mutate({ id: deleteConfirm.id, establishmentId });
    }
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getBreaksForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    return breaksData.filter((b) => (b.daysOfWeek ?? []).includes(dayOfWeek));
  };

  const getBlocksForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return blocksData.filter((b) => b.startTime && new Date(b.startTime).toISOString().split("T")[0] === dateStr);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const dayBreaks = getBreaksForDate(date);
      const dayBlocks = getBlocksForDate(date);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-2 min-h-24 border rounded-lg cursor-pointer transition-all ${
            isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"
          } ${isSelected ? "ring-2 ring-blue-500 bg-blue-100" : "hover:bg-gray-50"}`}
        >
          <div className="font-semibold text-sm mb-1">{day}</div>
          <div className="space-y-1">
            {dayBreaks.map((b) => (
              <div key={`break-${b.id}-${day}`} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded truncate" title={b.name}>
                {b.name}
              </div>
            ))}
            {dayBlocks.map((b) => (
              <div key={`block-${b.id}-${day}`} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded truncate" title={b.title}>
                {b.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const selectedDateBreaks = selectedDate ? getBreaksForDate(selectedDate) : [];
  const selectedDateBlocks = selectedDate ? getBlocksForDate(selectedDate) : [];
  const isLoading = loadingBreaks || loadingBlocks;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Calendário de Pausas e Bloqueios</CardTitle>
                <CardDescription>
                  {MONTHS[currentDate.getMonth()]} de {currentDate.getFullYear()}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="text-center font-semibold text-sm text-gray-600">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
                <div className="mt-6 pt-6 border-t space-y-2">
                  <p className="font-semibold text-sm mb-3">Legenda:</p>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded" />
                    <span className="text-sm text-gray-600">Pausa Recorrente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
                    <span className="text-sm text-gray-600">Bloqueio de Tempo</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? selectedDate.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                : "Selecione uma data"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDate && (selectedDateBreaks.length > 0 || selectedDateBlocks.length > 0) ? (
              <>
                {selectedDateBreaks.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />Pausas
                    </h4>
                    <div className="space-y-2">
                      {selectedDateBreaks.map((b) => (
                        <div key={b.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{b.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{b.startTime} - {b.endTime}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingBreak(b); setBreakDialogOpen(true); }}>✏️</Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteConfirm({ type: "break", id: b.id })}>🗑️</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedDateBlocks.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />Bloqueios
                    </h4>
                    <div className="space-y-2">
                      {selectedDateBlocks.map((b) => (
                        <div key={b.id} className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{b.title}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {b.startTime && new Date(b.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              {b.endTime && ` - ${new Date(b.endTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingBlock(b); setBlockDialogOpen(true); }}>✏️</Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteConfirm({ type: "block", id: b.id })}>🗑️</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : selectedDate ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">Nenhuma pausa ou bloqueio neste dia</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">Selecione uma data para ver detalhes</p>
              </div>
            )}

            {selectedDate && (
              <div className="pt-4 border-t space-y-2">
                <Button className="w-full" onClick={() => { setEditingBreak(undefined); setBreakDialogOpen(true); }} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />Adicionar Pausa
                </Button>
                <Button className="w-full" onClick={() => { setEditingBlock(undefined); setBlockDialogOpen(true); }} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />Adicionar Bloqueio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BreakDialog
        open={breakDialogOpen}
        onOpenChange={setBreakDialogOpen}
        onSave={handleBreakSave}
        initialData={editingBreak}
        isLoading={createBreak.isPending || updateBreak.isPending}
      />

      <TimeBlockDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        onSave={handleBlockSave}
        initialData={editingBlock ? {
          id: editingBlock.id,
          name: editingBlock.title,
          startTime: editingBlock.startTime
            ? new Date(editingBlock.startTime).toTimeString().slice(0, 5)
            : "09:00",
          endTime: editingBlock.endTime
            ? new Date(editingBlock.endTime).toTimeString().slice(0, 5)
            : "18:00",
          date: editingBlock.startTime
            ? new Date(editingBlock.startTime).toISOString().split("T")[0]
            : "",
          blockType: editingBlock.blockType || "maintenance",
        } : undefined}
        selectedDate={selectedDate || undefined}
        isLoading={createBlock.isPending || updateBlock.isPending}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {deleteConfirm?.type === "break" ? "Pausa" : "Bloqueio"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            Remover
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
