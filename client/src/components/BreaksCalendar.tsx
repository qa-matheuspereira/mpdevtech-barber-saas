import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Break {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek?: number[];
  isRecurring: boolean;
  type: "break" | "block";
  date?: string;
}

interface BreaksCalendarProps {
  breaks: Break[];
  timeBlocks: Break[];
  barberId?: number;
}

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function BreaksCalendar({ breaks, timeBlocks }: BreaksCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
    const dateStr = date.toISOString().split("T")[0];

    const recurringBreaks = breaks.filter((b) => {
      if (!b.isRecurring || !b.daysOfWeek) return false;
      return b.daysOfWeek.includes(dayOfWeek);
    });

    const specificBlocks = timeBlocks.filter((b) => {
      if (!b.date) return false;
      return b.date === dateStr;
    });

    return [...recurringBreaks, ...specificBlocks];
  };

  const getBlocksForDate = (date: Date): Break[] => {
    const dateStr = date.toISOString().split("T")[0];
    return timeBlocks.filter((b) => {
      if (!b.date) return false;
      return b.date === dateStr;
    });
  };

  const hasBreaksOrBlocks = (date: Date): boolean => {
    return getBreaksForDate(date).length > 0 || getBlocksForDate(date).length > 0;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday =
        date.toDateString() === new Date().toDateString();
      const isSelected =
        selectedDate && date.toDateString() === selectedDate.toDateString();
      const hasItems = hasBreaksOrBlocks(date);
      const dayBreaks = getBreaksForDate(date);
      const dayBlocks = getBlocksForDate(date);
      const dateStr = date.toISOString().split("T")[0];

      days.push(
        <div
          key={`day-${dateStr}`}
          onClick={() => setSelectedDate(date)}
          className={`p-2 min-h-24 border rounded-lg cursor-pointer transition-all ${
            isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"
          } ${isSelected ? "ring-2 ring-blue-500 bg-blue-100" : "hover:bg-gray-50"}`}
        >
          <div className="font-semibold text-sm mb-1">{day}</div>

          {hasItems && (
            <div className="space-y-1">
              {dayBreaks.map((b, idx) => (
                <div
                  key={`break-${dateStr}-${b.id}-${idx}`}
                  className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center gap-1"
                  title={`${b.name}: ${b.startTime} - ${b.endTime}`}
                >
                  <Clock className="w-3 h-3" />
                  <span className="truncate">{b.name}</span>
                </div>
              ))}

              {dayBlocks.map((b, idx) => (
                <div
                  key={`block-${dateStr}-${b.id}-${idx}`}
                  className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded flex items-center gap-1"
                  title={b.name}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span className="truncate">{b.name}</span>
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
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {renderCalendar()}
            </div>

            {/* Legend */}
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 rounded" />
                <span className="text-sm text-gray-600">Hoje</span>
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
                          key={`break-detail-${b.id}-${idx}`}
                          className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <p className="font-semibold text-sm">{b.name}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {b.startTime} - {b.endTime}
                          </p>
                          {b.isRecurring && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              Recorrente
                            </Badge>
                          )}
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
                          key={`block-detail-${b.id}-${idx}`}
                          className="p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <p className="font-semibold text-sm">{b.name}</p>
                          <p className="text-xs text-gray-600 mt-1">{b.startTime}</p>
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
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumo do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total de pausas:</span>
              <span className="font-semibold">{breaks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total de bloqueios:</span>
              <span className="font-semibold">{timeBlocks.length}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Dias com pausas:</span>
              <span className="font-semibold">
                {Array.from({ length: getDaysInMonth(currentDate) })
                  .map((_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1))
                  .filter((d) => hasBreaksOrBlocks(d)).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
