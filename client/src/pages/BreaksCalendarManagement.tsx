import DashboardLayout from "@/components/DashboardLayout";
import BreaksCalendarInteractive from "@/components/BreaksCalendarInteractive";

export default function BreaksCalendarManagement() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Pausas e Bloqueios</h1>
          <p className="text-muted-foreground mt-2">
            Crie, edite e remova pausas recorrentes e bloqueios de tempo diretamente no calendário
          </p>
        </div>

        {/* Calendar */}
        <BreaksCalendarInteractive
          onBreakCreate={(data) => console.log("Break created:", data)}
          onBreakUpdate={(id, data) => console.log("Break updated:", id, data)}
          onBreakDelete={(id) => console.log("Break deleted:", id)}
          onBlockCreate={(data) => console.log("Block created:", data)}
          onBlockUpdate={(id, data) => console.log("Block updated:", id, data)}
          onBlockDelete={(id) => console.log("Block deleted:", id)}
        />

        {/* Instructions */}
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
