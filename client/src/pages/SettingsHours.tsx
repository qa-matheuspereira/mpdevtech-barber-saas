import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Save, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const DAYS = [
  { id: 0, name: "Domingo", label: "DOM" },
  { id: 1, name: "Segunda", label: "SEG" },
  { id: 2, name: "Terça", label: "TER" },
  { id: 3, name: "Quarta", label: "QUA" },
  { id: 4, name: "Quinta", label: "QUI" },
  { id: 5, name: "Sexta", label: "SEX" },
  { id: 6, name: "Sábado", label: "SAB" },
];

export default function SettingsHours() {
  const utils = trpc.useUtils();

  // Fetch establishments
  const { data: establishments, isLoading: loadingShops } = trpc.establishment.list.useQuery();
  const [selectedestablishmentId, setSelectedestablishmentId] = useState<string>("");

  const effectiveestablishmentId = selectedestablishmentId
    ? parseInt(selectedestablishmentId)
    : establishments?.[0]?.id ?? 0;

  // Fetch current settings
  const { data: settings, isLoading: loadingSettings } = trpc.establishment.getSettings.useQuery(
    { establishmentId: effectiveestablishmentId },
    { enabled: effectiveestablishmentId > 0 }
  );

  const [hours, setHours] = useState({
    openTime: "09:00",
    closeTime: "18:00",
    closedDays: [0] as number[],
  });

  // Sync form state when settings load
  useEffect(() => {
    if (settings) {
      setHours({
        openTime: settings.openTime || "09:00",
        closeTime: settings.closeTime || "18:00",
        closedDays: (settings.closedDays as number[]) || [0],
      });
    }
  }, [settings]);

  const updateHours = trpc.establishment.updateOperatingHours.useMutation({
    onSuccess: () => {
      utils.settings.getSettings.invalidate();
      toast.success("Horários atualizados com sucesso!");
    },
    onError: (err) => toast.error(err.message || "Erro ao salvar horários"),
  });

  const toggleDay = (dayId: number) => {
    setHours((prev) => ({
      ...prev,
      closedDays: prev.closedDays.includes(dayId)
        ? prev.closedDays.filter((d) => d !== dayId)
        : [...prev.closedDays, dayId],
    }));
  };

  const handleSave = () => {
    const [openHour, openMin] = hours.openTime.split(":").map(Number);
    const [closeHour, closeMin] = hours.closeTime.split(":").map(Number);

    if (openHour * 60 + openMin >= closeHour * 60 + closeMin) {
      toast.error("Horário de abertura deve ser anterior ao de fechamento");
      return;
    }

    updateHours.mutate({
      establishmentId: effectiveestablishmentId,
      openTime: hours.openTime,
      closeTime: hours.closeTime,
      closedDays: hours.closedDays,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configurar Horários</h1>
            <p className="text-muted-foreground mt-2">Defina os horários de funcionamento do seu estabelecimento</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barbershop-select">Estabelecimento</Label>
            {loadingShops ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <Select
                value={selectedestablishmentId || (establishments?.[0]?.id?.toString() ?? "")}
                onValueChange={setSelectedestablishmentId}
              >
                <SelectTrigger id="barbershop-select" className="w-64">
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

        {loadingSettings ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Carregando configurações...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quick Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Horários Gerais
                </CardTitle>
                <CardDescription>Configure os horários padrão de funcionamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="openTime">Horário de Abertura</Label>
                    <Input
                      id="openTime"
                      type="time"
                      value={hours.openTime}
                      onChange={(e) => setHours({ ...hours, openTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closeTime">Horário de Fechamento</Label>
                    <Input
                      id="closeTime"
                      type="time"
                      value={hours.closeTime}
                      onChange={(e) => setHours({ ...hours, closeTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Days of Week */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Dias de Funcionamento</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className={`p-3 rounded-lg font-semibold text-sm transition-all ${hours.closedDays.includes(day.id)
                          ? "bg-slate-200 text-slate-500 border-2 border-slate-300"
                          : "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique nos dias para marcar como fechado
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    Estes horários serão usados como padrão para todos os agendamentos.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline">Cancelar</Button>
              <Button
                onClick={handleSave}
                disabled={updateHours.isPending}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {updateHours.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
