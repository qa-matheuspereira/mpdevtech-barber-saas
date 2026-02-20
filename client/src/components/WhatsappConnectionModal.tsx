import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, CheckCircle2, QrCode } from "lucide-react";

interface WhatsappConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  onSuccess?: () => void;
}

export default function WhatsappConnectionModal({
  open,
  onOpenChange,
  establishmentId,
  onSuccess,
}: WhatsappConnectionModalProps) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "pending" | "connected" | "error"
  >("pending");
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(false);

  // Create session mutation
  const createSessionMutation = trpc.whatsapp.createSession.useMutation({
    onError: (error) => {
      toast.error("Erro ao criar sessão WhatsApp");
      setIsConnecting(false);
      console.error(error);
    },
  });

  // Confirm connection mutation
  const confirmConnectionMutation =
    trpc.whatsapp.confirmConnection.useMutation({
      onSuccess: () => {
        toast.success("WhatsApp conectado com sucesso!");
        setConnectionStatus("connected");
        setIsConnecting(false);
        setPollingActive(false);
        onSuccess?.();
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      },
      onError: (error) => {
        toast.error("Erro ao confirmar conexão");
        console.error(error);
        setConnectionStatus("error");
        setIsConnecting(false);
        setPollingActive(false);
      },
    });

  // Get session query
  const getSessionQuery = trpc.whatsapp.getSession.useQuery(
    { id: sessionId || 0 },
    { enabled: !!sessionId && pollingActive, refetchInterval: 5000 }
  );

  // Monitorar mudanças no status da sessão
  useEffect(() => {
    if (
      getSessionQuery.data &&
      pollingActive &&
      getSessionQuery.data.status === "connected" &&
      getSessionQuery.data.phoneNumber
    ) {
      setPhoneNumber(getSessionQuery.data.phoneNumber);
      confirmConnectionMutation.mutate({
        sessionId: sessionId!,
        phoneNumber: getSessionQuery.data.phoneNumber,
      });
    }
  }, [getSessionQuery.data, pollingActive, sessionId]);

  const handleStartConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus("pending");
    try {
      const data = await createSessionMutation.mutateAsync({
        establishmentId: establishmentId,
        sessionName: `Session-${Date.now()}`,
      });
      setSessionId(data.id);
      setQrCode(data.qrCode);
      setPollingActive(true);
    } catch (error) {
      setIsConnecting(false);
      setPollingActive(false);
      console.error(error);
    }
  };

  const handleClose = () => {
    if (!isConnecting) {
      setSessionId(null);
      setQrCode(null);
      setConnectionStatus("pending");
      setPhoneNumber(null);
      setIsConnecting(false);
      setPollingActive(false);
      onOpenChange(false);
    }
  };

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => {
      setPollingActive(false);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com seu celular para conectar WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Messages */}
          {connectionStatus === "pending" && !qrCode && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Clique no botão abaixo para gerar o QR Code
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erro ao conectar WhatsApp. Tente novamente.
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === "connected" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                WhatsApp conectado com sucesso! {phoneNumber && `(${phoneNumber})`}
              </AlertDescription>
            </Alert>
          )}

          {/* QR Code Display */}
          {qrCode && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>

              {isConnecting && (
                <div className="text-center space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Aguardando confirmação...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Escaneie o QR Code com seu celular
                  </p>
                </div>
              )}

              {connectionStatus === "connected" && (
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
                  <p className="text-sm font-medium text-green-600">
                    Conectado com sucesso!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isConnecting}
            >
              {connectionStatus === "connected" ? "Fechar" : "Cancelar"}
            </Button>

            {!qrCode && (
              <Button
                onClick={handleStartConnection}
                disabled={isConnecting || createSessionMutation.isPending}
                className="gap-2"
              >
                {isConnecting || createSessionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    Gerar QR Code
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">Como conectar:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Clique em "Gerar QR Code"</li>
              <li>Abra WhatsApp no seu celular</li>
              <li>Vá em Configurações → Dispositivos Conectados</li>
              <li>Escaneie o QR Code com a câmera</li>
              <li>Aguarde a confirmação</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
