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

  // List sessions query
  const { data: sessions, isLoading, refetch } = trpc.whatsapp.listSessions.useQuery({
    establishmentId,
  });

  // Get active session query
  const { data: activeSession } = trpc.whatsapp.getActiveSession.useQuery({
    establishmentId,
  });

  // Disconnect mutation
  const disconnectMutation = trpc.whatsapp.disconnectSession.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp desconectado");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao desconectar WhatsApp");
    },
  });

  // Delete mutation
  const deleteMutation = trpc.whatsapp.deleteSession.useMutation({
    onSuccess: () => {
      toast.success("Sessão deletada");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao deletar sessão");
    },
  });

  const handleDisconnect = (sessionId: number) => {
    disconnectMutation.mutate({ sessionId });
  };

  const handleDelete = (sessionId: number) => {
    if (confirm("Tem certeza que deseja deletar esta sessão?")) {
      deleteMutation.mutate({ sessionId });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-600">Conectado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600">Pendente</Badge>;
      case "disconnected":
        return <Badge className="bg-gray-600">Desconectado</Badge>;
      case "error":
        return <Badge className="bg-red-600">Erro</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Session Status */}
      {activeSession && (
        <Alert className="border-green-200 bg-green-50">
          <MessageSquare className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            WhatsApp conectado: {activeSession.phoneNumber} • Sistema pronto para enviar mensagens
          </AlertDescription>
        </Alert>
      )}

      {!activeSession && sessions && sessions.length === 0 && (
        <Alert>
          <AlertDescription>
            Nenhuma sessão WhatsApp conectada. Clique no botão abaixo para conectar.
          </AlertDescription>
        </Alert>
      )}

      {/* Sessions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : sessions && sessions.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold">Sessões WhatsApp</h3>
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{session.sessionName}</CardTitle>
                    <CardDescription>
                      {session.phoneNumber || "Telefone não disponível"}
                    </CardDescription>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Session Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{session.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ativo</p>
                      <p className="font-medium">
                        {session.isActive ? "Sim" : "Não"}
                      </p>
                    </div>
                    {session.connectedAt && (
                      <div>
                        <p className="text-muted-foreground">Conectado em</p>
                        <p className="font-medium text-xs">
                          {new Date(session.connectedAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    )}
                    {session.errorMessage && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Erro</p>
                        <p className="font-medium text-red-600 text-xs">
                          {session.errorMessage}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {session.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(session.id)}
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
                      onClick={() => handleDelete(session.id)}
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
          ))}
        </div>
      ) : null}

      {/* Connect Button */}
      <Button
        onClick={() => setIsConnectionModalOpen(true)}
        className="w-full gap-2"
        size="lg"
      >
        <Plus className="w-4 h-4" />
        Conectar WhatsApp
      </Button>

      {/* Connection Modal */}
      <WhatsappConnectionModal
        open={isConnectionModalOpen}
        onOpenChange={setIsConnectionModalOpen}
        establishmentId={establishmentId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
