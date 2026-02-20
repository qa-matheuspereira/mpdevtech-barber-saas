import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface DateSelectorProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  disabledDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  isLoading?: boolean;
}

export default function DateSelector({
  selectedDate,
  onSelectDate,
  disabledDates = [],
  minDate,
  maxDate,
  isLoading = false,
}: DateSelectorProps) {
  const [month, setMonth] = useState(new Date());

  const isDateDisabled = (date: Date) => {
    // Check if date is in disabled list
    if (disabledDates.some((d) => d.toDateString() === date.toDateString())) {
      return true;
    }

    // Check min/max dates
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;

    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    return false;
  };

  const handlePrevMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1));
  };

  const getDayOfWeekLabel = (date: Date) => {
    return format(date, "EEEE", { locale: pt }).charAt(0).toUpperCase() +
      format(date, "EEEE", { locale: pt }).slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Selecione uma Data</CardTitle>
          <CardDescription>
            Escolha um dia disponível para seu agendamento
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <h2 className="text-lg font-semibold">
                {format(month, "MMMM yyyy", { locale: pt })}
              </h2>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(date) => {
                if (date && !isDateDisabled(date)) {
                  onSelectDate(date);
                }
              }}
              disabled={isDateDisabled}
              month={month}
              onMonthChange={setMonth}
              locale={pt}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Info */}
      {selectedDate && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-900">Data Selecionada</p>
                <p className="text-sm text-green-800">
                  {getDayOfWeekLabel(selectedDate)}, {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                </p>
              </div>
              <Badge className="bg-green-600 hover:bg-green-700">✓ Confirmado</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Dicas para agendamento:</p>
              <ul className="space-y-1 text-xs">
                <li>• Datas passadas estão desabilitadas</li>
                <li>• Selecione uma data com horários disponíveis</li>
                <li>• Você poderá escolher o horário na próxima etapa</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
