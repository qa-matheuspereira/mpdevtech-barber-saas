import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface ConflictInfo {
  hasBreakConflict?: boolean;
  hasTimeBlockConflict?: boolean;
  hasAppointmentConflict?: boolean;
  message?: string;
}

interface TimeSlotSelectorProps {
  date: Date;
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelectSlot: (startTime: string) => void;
  isLoading?: boolean;
  establishmentId: number;
  durationMinutes?: number;
}

export default function TimeSlotSelector({
  date,
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading = false,
  establishmentId,
  durationMinutes = 60,
}: TimeSlotSelectorProps) {
  const [conflictDetails, setConflictDetails] = useState<Record<string, ConflictInfo>>({});
  const [loadingSlots, setLoadingSlots] = useState<Set<string>>(new Set());

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getConflictReason = (slot: TimeSlot): string => {
    if (!slot.available) {
      const details = conflictDetails[slot.startTime];
      if (details?.message) {
        return details.message;
      }
      if (details?.hasBreakConflict) {
        return "Conflita com pausa agendada";
      }
      if (details?.hasTimeBlockConflict) {
        return "Conflita com bloqueio de tempo";
      }
      if (details?.hasAppointmentConflict) {
        return "Conflita com outro agendamento";
      }
      return "Horário indisponível";
    }
    return "Horário disponível";
  };

  const getConflictColor = (slot: TimeSlot): string => {
    if (!slot.available) {
      const details = conflictDetails[slot.startTime];
      if (details?.hasBreakConflict) {
        return "bg-orange-50 border-orange-200";
      }
      if (details?.hasTimeBlockConflict) {
        return "bg-red-50 border-red-200";
      }
      if (details?.hasAppointmentConflict) {
        return "bg-yellow-50 border-yellow-200";
      }
      return "bg-slate-50 border-slate-200";
    }
    return "bg-white border-slate-200 hover:border-blue-300";
  };

  const availableCount = slots.filter((s) => s.available).length;
  const unavailableCount = slots.length - availableCount;

  // Group slots by hour for better organization
  const groupedSlots = slots.reduce(
    (acc, slot) => {
      const hour = slot.startTime.split(":")[0];
      if (!acc[hour]) {
        acc[hour] = [];
      }
      acc[hour].push(slot);
      return acc;
    },
    {} as Record<string, TimeSlot[]>
  );

  const hours = Object.keys(groupedSlots).sort();

  return (
    <div className="space-y-6">
      {/* Header com informações */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Selecione um Horário
              </CardTitle>
              <CardDescription className="mt-2">
                {formatDate(date)} • {availableCount} horários disponíveis
              </CardDescription>
            </div>
            {unavailableCount > 0 && (
              <Badge variant="secondary" className="bg-slate-100">
                {unavailableCount} indisponível{unavailableCount !== 1 ? "is" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-muted-foreground">Carregando horários disponíveis...</p>
          </div>
        </div>
      )}

      {/* Slots grid */}
      {!isLoading && slots.length > 0 && (
        <div className="space-y-6">
          {hours.map((hour) => (
            <div key={hour} className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-600 px-1">
                {hour}:00 - {String(parseInt(hour) + 1).padStart(2, "0")}:00
              </h3>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {groupedSlots[hour].map((slot) => (
                  <Tooltip key={slot.startTime} delayDuration={200}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          if (slot.available) {
                            onSelectSlot(slot.startTime);
                          }
                        }}
                        disabled={!slot.available}
                        className={cn(
                          "relative p-3 rounded-lg border-2 transition-all duration-200",
                          "text-sm font-medium",
                          slot.available
                            ? selectedSlot === slot.startTime
                              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:shadow-sm cursor-pointer"
                            : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                        )}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{slot.startTime}</span>
                          {slot.available ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className={cn(
                        "text-xs",
                        !slot.available && "bg-slate-900 text-white"
                      )}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold">
                          {slot.startTime} - {slot.endTime}
                        </p>
                        <p>{getConflictReason(slot)}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && slots.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Nenhum horário disponível para esta data.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Tente selecionar outra data.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {slots.length > 0 && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-700">Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-slate-700">Indisponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-700">Selecionado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected slot summary */}
      {selectedSlot && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Horário Selecionado</p>
                <p className="text-sm text-green-800">
                  {selectedSlot} - {slots.find((s) => s.startTime === selectedSlot)?.endTime}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
