import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface Break {
  id: number;
  name: string;
  startTime: string;
  endTime?: string;
  daysOfWeek?: number[];
  isRecurring: boolean;
  type: "break" | "block";
  date?: string;
  blockType?: "maintenance" | "absence" | "closed" | "custom";
}

interface BreaksCalendarInteractiveProps {
  onBreakCreate?: (breakData: any) => void;
  onBreakUpdate?: (id: number, breakData: any) => void;
  onBreakDelete?: (id: number) => void;
  onBlockCreate?: (blockData: any) => void;
  onBlockUpdate?: (id: number, blockData: any) => void;
  onBlockDelete?: (id: number) => void;
}

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Mock data
const mockBreaks = [
  {
    id: 1,
    name: "Almoço",
    startTime: "12:00",
    endTime: "13:00",
    daysOfWeek: [1, 2, 3, 4, 5],
    isRecurring: true,
    type: "break" as const,
  },
  {
    id: 2,
    name: "Café",
    startTime: "15:30",
    endTime: "16:00",
    daysOfWeek: [1, 2, 3, 4, 5],
    isRecurring: true,
    type: "break" as const,
  },
];

const mockTimeBlocks = [
  {
    id: 1,
    name: "Manutenção",
    startTime: "14:00",
    endTime: "15:00",
    date: new Date().toISOString().split("T")[0],
    isRecurring: false,
    type: "block" as const,
  },
];

export default function BreaksCalendarInteractive({
  onBreakCreate,
  onBreakUpdate,
  onBreakDelete,
  onBlockCreate,
  onBlockUpdate,
  onBlockDelete,
}: BreaksCalendarInteractiveProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [breaks, setBreaks] = useState<Break[]>(mockBreaks);
  const [timeBlocks, setTimeBlocks] = useState<Break[]>(mockTimeBlocks);

  const [breakDialogOpen, setBreakDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBreak, setEditingBreak] = useState<Break | undefined>();
  const [editingBlock, setEditingBlock] = useState<Break | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "break" | "block"; id: number } | null>(null);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getBreaksForDate = (date: Date): Break[] => {
    const dayOfWeek = date.getDay();
    return breaks.filter((b) => b.daysOfWeek?.includes(dayOfWeek));
  };

  const getBlocksForDate = (date: Date): Break[] => {
    const dateStr = date.toISOString().split("T")[0];
    return timeBlocks.filter((b) => b.date === dateStr);
  };

  const hasBreaksOrBlocks = (date: Date): boolean => {
    return getBreaksForDate(date).length > 0 || getBlocksForDate(date).length > 0;
  };

  const handleBreakSave = (breakData: any) => {
    if (editingBreak) {
      setBreaks((prev) =>
        prev.map((b) => (b.id === editingBreak.id ? { ...b, ...breakData } : b))
      );
      onBreakUpdate?.(editingBreak.id, breakData);
      toast.success("Pausa atualizada");
      setEditingBreak(undefined);
    } else {
      const newBreak = { ...breakData, id: Math.max(...breaks.map((b) => b.id), 0) + 1, type: "break" as const };
      setBreaks((prev) => [...prev, newBreak]);
      onBreakCreate?.(breakData);
      toast.success("Pausa criada");
    }
    setBreakDialogOpen(false);
  };

  const handleBlockSave = (blockData: any) => {
    if (editingBlock) {
      setTimeBlocks((prev) =>
        prev.map((b) => (b.id === editingBlock.id ? { ...b, ...blockData } : b))
      );
      onBlockUpdate?.(editingBlock.id, blockData);
      toast.success("Bloqueio atualizado");
      setEditingBlock(undefined);
    } else {
      const newBlock = { ...blockData, id: Math.max(...timeBlocks.map((b) => b.id), 0) + 1, type: "block" as const };
      setTimeBlocks((prev) => [...prev, newBlock]);
      onBlockCreate?.(blockData);
      toast.success("Bloqueio criado");
    }
    setBlockDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === "break") {
      setBreaks((prev) => prev.filter((b) => b.id !== deleteConfirm.id));
      onBreakDelete?.(deleteConfirm.id);
      toast.success("Pausa removida");
    } else {
      setTimeBlocks((prev) => prev.filter((b) => b.id !== deleteConfirm.id));
      onBlockDelete?.(deleteConfirm.id);
      toast.success("Bloqueio removido");
    }
    setDeleteConfirm(null);
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
      const hasItems = hasBreaksOrBlocks(date);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-2 min-h-24 border rounded-lg cursor-pointer transition-all ${
            isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"
          } ${isSelected ? "ring-2 ring-blue-500 bg-blue-100" : "hover:bg-gray-50"}`}
        >
          <div className="font-semibold text-sm mb-1">{day}</div>

          {hasItems && (
            <div className="space-y-1">
              {getBreaksForDate(date).map((b, idx) => (
                <div
                  key={`break-${b.id}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${idx}`}
                  className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded truncate"
                  title={b.name}
                >
                  {b.name}
                </div>
              ))}

              {getBlocksForDate(date).map((b, idx) => (
                <div
                  key={`block-${b.id}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${idx}`}
                  className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded truncate"
                  title={b.name}
                >
                  {b.name}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const selectedDateBreaks = selectedDate ? getBreaksForDate(selectedDate) : [];
  const selectedDateBlocks = selectedDate ? getBlocksForDate(selectedDate) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
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
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {renderCalendar()}
            </div>

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
          </CardContent>
        </Card>
      </div>

      {/* Details Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Selecione uma data"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {selectedDate && (selectedDateBreaks.length > 0 || selectedDateBlocks.length > 0) ? (
              <>
                {/* Breaks */}
                {selectedDateBreaks.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      Pausas
                    </h4>
                    <div className="space-y-2">
                      {selectedDateBreaks.map((b, idx) => (
                        <div
                          key={`break-detail-${b.id}-${selectedDate?.getTime()}-${idx}`}
                          className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{b.name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {b.startTime} - {b.endTime}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingBreak(b);
                              setBreakDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            ✏️
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blocks */}
                {selectedDateBlocks.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      Bloqueios
                    </h4>
                    <div className="space-y-2">
                      {selectedDateBlocks.map((b, idx) => (
                        <div
                          key={`block-detail-${b.id}-${selectedDate?.getTime()}-${idx}`}
                          className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{b.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{b.startTime}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingBlock(b);
                              setBlockDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            ✏️
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : selectedDate ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-4">Nenhuma pausa ou bloqueio neste dia</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">Selecione uma data para ver detalhes</p>
              </div>
            )}

            {selectedDate && (
              <div className="pt-4 border-t space-y-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    setEditingBreak(undefined);
                    setBreakDialogOpen(true);
                  }}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Pausa
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    setEditingBlock(undefined);
                    setBlockDialogOpen(true);
                  }}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Bloqueio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <BreakDialog
        open={breakDialogOpen}
        onOpenChange={setBreakDialogOpen}
        onSave={handleBreakSave}
        initialData={editingBreak}
      />

      <TimeBlockDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        onSave={handleBlockSave}
        initialData={editingBlock ? {
          id: editingBlock.id,
          name: editingBlock.name,
          startTime: editingBlock.startTime,
          endTime: editingBlock.endTime,
          date: editingBlock.date || "",
          blockType: editingBlock.blockType || "maintenance",
        } : undefined}
        selectedDate={selectedDate || undefined}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {deleteConfirm?.type === "break" ? "Pausa" : "Bloqueio"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O {deleteConfirm?.type === "break" ? "pausa" : "bloqueio"} será removido
              permanentemente.
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
