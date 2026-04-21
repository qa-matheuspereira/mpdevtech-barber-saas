import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import BreaksCalendarInteractive from "@/components/BreaksCalendarInteractive";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

export default function BreaksCalendarManagement() {
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>("");
  const { data: establishments, isLoading } = trpc.establishment.list.useQuery();

  const effectiveId = selectedEstablishment
    ? parseInt(selectedEstablishment)
    : establishments?.[0]?.id ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Pausas e Bloqueios</h1>
            <p className="text-muted-foreground mt-2">
              Crie, edite e remova pausas recorrentes e bloqueios de tempo diretamente no calendário
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="est-select">Estabelecimento</Label>
            <Select
              value={selectedEstablishment || (establishments?.[0]?.id.toString() ?? "")}
              onValueChange={setSelectedEstablishment}
            >
              <SelectTrigger id="est-select" className="w-64">
                <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione"} />
              </SelectTrigger>
              <SelectContent>
                {(establishments ?? []).map((shop) => (
                  <SelectItem key={shop.id} value={shop.id.toString()}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {effectiveId > 0 && <BreaksCalendarInteractive establishmentId={effectiveId} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Como Criar uma Pausa</h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Selecione uma data no calendário</li>
              <li>Clique em "Adicionar Pausa"</li>
              <li>Preencha o nome, horários e dias da semana</li>
              <li>Clique em "Salvar"</li>
            </ol>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-semibold text-red-900 mb-3">Como Criar um Bloqueio</h3>
            <ol className="text-sm text-red-800 space-y-2 list-decimal list-inside">
              <li>Selecione uma data no calendário</li>
              <li>Clique em "Adicionar Bloqueio"</li>
              <li>Preencha a descrição, tipo e horários</li>
              <li>Clique em "Salvar"</li>
            </ol>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
