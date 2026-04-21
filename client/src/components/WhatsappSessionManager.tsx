import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageSquare, Trash2, Power, Plus } from "lucide-react";
import WhatsappConnectionModal from "./WhatsappConnectionModal";

interface WhatsappSessionManagerProps {
  establishmentId: number;
}

export default function WhatsappSessionManager({
  establishmentId,
}: WhatsappSessionManagerProps) {
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);

  // Get instance settings
  const { data: settings, isLoading, refetch } = trpc.whatsapp.getSettings.useQuery(
    { establishmentId }
  );

  // Check connection status (polls every 30s when instance exists)
  const { data: connectionData, refetch: refetchStatus } = trpc.whatsapp.checkConnectionStatus.useQuery(
    { establishmentId },
    { enabled: !!settings, refetchInterval: 30000 }
  );

  const connectionState = (connectionData as any)?.instance?.state;
  const isConnected = connectionState === "open";

  // Disconnect mutation
  const disconnectMutation = trpc.whatsapp.disconnectSession.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp desconectado");
      refetch();
      refetchStatus();
    },
    onError: () => {
      toast.error("Erro ao desconectar WhatsApp");
    },
  });

  // Delete mutation
  const deleteMutation = trpc.whatsapp.deleteSession.useMutation({
    onSuccess: () => {
      toast.success("Instância deletada");
      refetch();
      refetchStatus();
    },
    onError: () => {
      toast.error("Erro ao deletar instância");
    },
  });

  const getStatusBadge = (state?: string) => {
    switch (state) {
      case "open":
        return <Badge className="bg-green-600">Conectado</Badge>;
      case "connecting":
        return <Badge className="bg-yellow-600">Conectando</Badge>;
      case "close":
      case "disconnected":
        return <Badge className="bg-gray-600">Desconectado</Badge>;
      default:
        return <Badge className="bg-gray-600">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Connection Status */}
      {isConnected && (
        <Alert className="border-green-200 bg-green-50">
          <MessageSquare className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            WhatsApp conectado • Sistema pronto para enviar mensagens
          </AlertDescription>
        </Alert>
      )}

      {!settings && !isLoading && (
        <Alert>
          <AlertDescription>
            Nenhuma instância WhatsApp configurada. Configure as credenciais da Evolution API e clique no botão abaixo para conectar.
          </AlertDescription>
        </Alert>
      )}

      {/* Instance Card */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : settings ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">{settings.instanceName}</CardTitle>
                <CardDescription>
                  {settings.apiUrl || "URL não configurada"}
                </CardDescription>
              </div>
              {getStatusBadge(connectionState)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{connectionState || "Desconhecido"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ativo</p>
                  <p className="font-medium">{settings.isActive ? "Sim" : "Não"}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {isConnected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => disconnectMutation.mutate({ establishmentId })}
                    disabled={disconnectMutation.isPending}
                    className="gap-2"
                  >
                    {disconnectMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                    Desconectar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja deletar esta instância?")) {
                      deleteMutation.mutate({ establishmentId });
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="gap-2 ml-auto"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Deletar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Connect Button */}
      <Button
        onClick={() => setIsConnectionModalOpen(true)}
        className="w-full gap-2"
        size="lg"
        disabled={!settings}
      >
        <Plus className="w-4 h-4" />
        {isConnected ? "Reconectar WhatsApp" : "Conectar WhatsApp"}
      </Button>

      {!settings && (
        <p className="text-xs text-center text-muted-foreground">
          Configure as credenciais da Evolution API na aba "Configurações" antes de conectar.
        </p>
      )}

      {/* Connection Modal */}
      <WhatsappConnectionModal
        open={isConnectionModalOpen}
        onOpenChange={setIsConnectionModalOpen}
        establishmentId={establishmentId}
        onSuccess={() => {
          refetch();
          refetchStatus();
        }}
      />
    </div>
  );
}
