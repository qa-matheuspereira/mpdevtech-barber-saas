import DashboardLayout from "@/components/DashboardLayout";
import BreaksCalendar from "@/components/BreaksCalendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function BreaksCalendarView() {
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

  // Fetch time blocks
  const { data: timeBlocksList, isLoading: loadingBlocks } = trpc.breaks.getTimeBlocks.useQuery(
    { establishmentId: effectiveestablishmentId },
    { enabled: effectiveestablishmentId > 0 }
  );

  // Transform breaks for calendar
  const calendarBreaks = breaksList?.map((b) => ({
    ...b,
    type: "break" as const,
    isRecurring: true,
  })) || [];

  // Transform blocks for calendar
  const calendarBlocks = timeBlocksList?.map((b) => ({
    id: b.id,
    name: b.title,
    // Extract time from Date object
    startTime: format(new Date(b.startTime), 'HH:mm'),
    endTime: format(new Date(b.endTime), 'HH:mm'),
    // Extract date YYYY-MM-DD
    date: format(new Date(b.startTime), 'yyyy-MM-dd'),
    isRecurring: b.isRecurring,
    type: "block" as const,
  })) || [];

  const isLoading = loadingShops || loadingBreaks || loadingBlocks;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendário de Pausas e Bloqueios</h1>
            <p className="text-muted-foreground mt-2">
              Visualize todas as suas pausas recorrentes e bloqueios de tempo em um calendário interativo
            </p>
          </div>
          <div className="space-y-2">
            {loadingShops ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <Select
                value={selectedestablishmentId || (establishments?.[0]?.id?.toString() ?? "")}
                onValueChange={setSelectedestablishmentId}
              >
                <SelectTrigger className="w-[200px]">
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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Calendar */}
            <BreaksCalendar breaks={calendarBreaks} timeBlocks={calendarBlocks} />

            {/* Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pausas Recorrentes</CardTitle>
                  <CardDescription>Pausas que se repetem regularmente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    As pausas recorrentes aparecem em amarelo no calendário. Elas se repetem automaticamente nos dias
                    selecionados toda semana.
                  </p>
                  <ul className="space-y-2 text-sm">
                    {calendarBreaks.length > 0 ? (
                      calendarBreaks.slice(0, 5).map((b) => (
                        <li key={b.id} className="flex items-start gap-2">
                          <span className="text-yellow-600 font-bold">•</span>
                          <span>{b.name}: {b.startTime} - {b.endTime}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground italic">Nenhuma pausa cadastrada</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bloqueios de Tempo</CardTitle>
                  <CardDescription>Períodos específicos bloqueados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Os bloqueios de tempo aparecem em vermelho no calendário. Eles são períodos específicos onde você não
                    está disponível para agendamentos.
                  </p>
                  <ul className="space-y-2 text-sm">
                    {calendarBlocks.length > 0 ? (
                      calendarBlocks.slice(0, 5).map((b) => (
                        <li key={b.id} className="flex items-start gap-2">
                          <span className="text-red-600 font-bold">•</span>
                          <span>{b.name}: {format(new Date(b.date || ""), 'dd/MM')} às {b.startTime}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground italic">Nenhum bloqueio cadastrado</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Dicas de Uso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>Clique em qualquer data</strong> para ver os detalhes de pausas e bloqueios daquele dia
                </p>
                <p>
                  <strong>Use os botões de navegação</strong> para visualizar meses anteriores ou futuros
                </p>
                <p>
                  <strong>O resumo do mês</strong> mostra quantas pausas e bloqueios você tem configurados
                </p>
                <p>
                  <strong>Datas em azul</strong> indicam o dia de hoje para referência rápida
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
