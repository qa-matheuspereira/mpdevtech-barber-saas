
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, QrCode, RefreshCw, Server, Bot, Webhook } from "lucide-react";
import QRCode from "qrcode";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function WhatsappSettings() {
  const [activeTab, setActiveTab] = useState("connection");
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Form State
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [instanceName, setInstanceName] = useState("");

  // AI State
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [aiPrompt, setAiPrompt] = useState("");

  // Connection State
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [generatedQr, setGeneratedQr] = useState<string | null>(null);

  // Generate QR if needed
  useEffect(() => {
    if (qrCode && !qrCode.startsWith("data:image")) {
      QRCode.toDataURL(qrCode)
        .then(setGeneratedQr)
        .catch(err => console.error("QR Generation error", err));
    } else {
      setGeneratedQr(null);
    }
  }, [qrCode]);

  // Queries
  const { data: settings, isLoading: loadingSettings } = trpc.whatsapp.getSettings.useQuery();
  const { data: connectionStatus, isLoading: loadingStatus, refetch: refetchStatus } =
    trpc.whatsapp.checkConnectionStatus.useQuery(
      undefined,
      {
        enabled: !!settings?.id,
        refetchInterval: (query: any) => (query.state.data?.status === "connected" ? false : 3000)
      }
    );

  // Mutations
  const updateSettings = trpc.whatsapp.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      utils.whatsapp.getSettings.invalidate();
    },
    onError: (error) => toast.error(`Erro ao salvar: ${error.message}`),
  });

  const createInstance = trpc.whatsapp.createInstance.useMutation({
    onSuccess: () => {
      toast.success("Instância criada com sucesso!");
      refetchStatus();
    },
    onError: (error) => toast.error(`Erro ao criar instância: ${error.message}`),
  });

  const connectInstance = trpc.whatsapp.connectInstance.useMutation({
    onSuccess: (data: any) => {
      if (data?.qrcode?.base64) {
        setQrCode(data.qrcode.base64); // Evolution returns base64
      } else if (data?.base64) {
        setQrCode(data.base64);
      } else {
        // Sometimes it returns text qr?
        // Let's assume base64 for now or handle appropriately
        setQrCode(JSON.stringify(data));
      }
      toast.info("QR Code gerado! Escaneie com seu WhatsApp.");
    },
    onError: (error) => toast.error(`Erro ao conectar: ${error.message}`),
  });

  const disconnectInstance = trpc.whatsapp.disconnectSession.useMutation({
    onSuccess: () => {
      toast.success("Instância desconectada!");
      setQrCode(null);
      refetchStatus();
    },
    onError: (error) => toast.error(`Erro ao desconectar: ${error.message}`),
  });

  const deleteInstance = trpc.whatsapp.deleteSession.useMutation({
    onSuccess: () => {
      toast.success("Instância deletada!");
      setQrCode(null);
      utils.whatsapp.getSettings.invalidate();
    },
    onError: (error) => toast.error(`Erro ao deletar: ${error.message}`),
  });

  // Load settings into state
  useEffect(() => {
    if (settings) {
      setApiUrl(settings.apiUrl || "");
      setApiKey(settings.apiKey || "");
      setInstanceName(settings.instanceName || "barber-bot");

      const aiConfig = settings.aiConfig as any || {};
      setAiEnabled(aiConfig.enabled || false);
      setAiModel(aiConfig.model || "gpt-3.5-turbo");
      setAiPrompt(aiConfig.prompt || "Você é um assistente virtual de um estabelecimento...");
    }
  }, [settings]);

  // Handle Updates
  const handleSaveSettings = () => {
    updateSettings.mutate({
      apiUrl,
      apiKey,
      instanceName,
      aiConfig: {
        enabled: aiEnabled,
        model: aiModel,
        prompt: aiPrompt,
      },
    });
  };

  const statusColor = connectionStatus?.status === "connected" ? "text-green-500" :
    connectionStatus?.status === "connecting" ? "text-yellow-500" : "text-red-500";

  const statusText = connectionStatus?.status === "connected" ? "Conectado" :
    connectionStatus?.status === "connecting" ? "Conectando..." : "Desconectado";

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">WhatsApp & IA Agent</h1>
              <p className="text-muted-foreground mt-2">
                Configure a integração com Evolution API e seu Agente de Inteligência Artificial.
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full border ${statusColor} bg-opacity-10 border-current flex items-center gap-2 font-medium`}>
            <div className={`w-3 h-3 rounded-full ${statusColor.replace("text-", "bg-")}`} />
            {statusText}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="connection" className="gap-2"><Server className="w-4 h-4" /> Conexão</TabsTrigger>
            <TabsTrigger value="agent" className="gap-2"><Bot className="w-4 h-4" /> Agente IA</TabsTrigger>
            <TabsTrigger value="webhook" className="gap-2"><Webhook className="w-4 h-4" /> Webhook</TabsTrigger>
          </TabsList>

          {/* CONNECTION TAB */}
          <TabsContent value="connection" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração da API</CardTitle>
                <CardDescription>
                  Conecte-se à sua instância da Evolution API v2.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="apiUrl">URL da API</Label>
                  <Input
                    id="apiUrl"
                    placeholder="https://api.seudominio.com"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apiKey">Global API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Sua chave global da Evolution API"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instanceName">Nome da Instância</Label>
                  <Input
                    id="instanceName"
                    placeholder="ex: estabelecimento-bot"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-between border-t px-6 py-4">
                <div className="text-sm text-gray-500">
                  {updateSettings.isPending ? "Salvando..." : "Não esqueça de salvar antes de conectar."}
                </div>
                <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                  {updateSettings.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Configurações
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Instância</CardTitle>
                <CardDescription>
                  Controle o status da sua conexão com o WhatsApp.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!settings ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Salve as configurações acima primeiro.
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          onClick={() => createInstance.mutate()}
                          disabled={connectionStatus?.status === "connected" || createInstance.isPending}
                          className="justify-start"
                        >
                          {createInstance.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Server className="mr-2 h-4 w-4" />}
                          1. Criar/Verificar Instância
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => connectInstance.mutate()}
                          disabled={connectionStatus?.status === "connected" || connectInstance.isPending}
                          className="justify-start"
                        >
                          {connectInstance.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                          2. Gerar QR Code
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => disconnectInstance.mutate()}
                          disabled={connectionStatus?.status !== "connected" || disconnectInstance.isPending}
                          className="justify-start text-white"
                        >
                          Desconectar
                        </Button>

                        <Button
                          variant="ghost"
                          className="justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Tem certeza? Isso apagará a instância.")) deleteInstance.mutate()
                          }}
                        >
                          Deletar Instância
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/20 min-h-[300px]">
                      {qrCode && connectionStatus?.status !== "connected" ? (
                        <div className="text-center space-y-4">
                          <p className="font-medium">Escaneie o QR Code:</p>
                          <div className="bg-white p-4 rounded shadow-sm inline-block">
                            {qrCode.startsWith("data:image") ? (
                              <img src={qrCode} alt="QR Code" className="w-[200px] h-[200px]" />
                            ) : generatedQr ? (
                              <img src={generatedQr} alt="QR Code" className="w-[200px] h-[200px]" />
                            ) : (
                              <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded">
                                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : connectionStatus?.status === "connected" ? (
                        <div className="text-center space-y-4 text-green-600">
                          <CheckCircle2 className="w-16 h-16 mx-auto" />
                          <p className="font-bold text-lg">WhatsApp Conectado</p>
                          <p className="text-sm text-gray-500">{connectionStatus.phoneNumber}</p>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <QrCode className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p>Aguardando ação...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI AGENT TAB */}
          <TabsContent value="agent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Agente IA</CardTitle>
                <CardDescription>
                  Defina como a Inteligência Artificial deve interagir com seus clientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Habilitar Agente IA</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir que a IA responda mensagens automaticamente.
                    </p>
                  </div>
                  <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="model">Modelo (OpenAI)</Label>
                  <Input
                    id="model"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    placeholder="gpt-4o-mini"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="prompt">Prompt do Sistema</Label>
                  <Textarea
                    id="prompt"
                    className="min-h-[200px] font-mono text-sm"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Você é um assistente do estabelecimento..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Instruções detalhadas sobre como o agente deve se comportar, horários, serviços, etc.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t px-6 py-4">
                <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                  {updateSettings.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Configurações de IA
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* WEBHOOK TAB */}
          <TabsContent value="webhook" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Webhook</CardTitle>
                <CardDescription>
                  Url que a Evolution API deve chamar para enviar eventos para este sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm border border-yellow-200">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Ao criar a instância por esta tela, o webhook é configurado automaticamente.
                  Use estas informações apenas para depuração ou configuração manual.
                </div>

                <div className="grid gap-2">
                  <Label>Webhook URL (Este sistema)</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={`${window.location.origin}/api/webhook/whatsapp`} />
                    <Button variant="outline" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/webhook/whatsapp`);
                      toast.success("Copiado!");
                    }}>Copiar</Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Eventos Necessários</Label>
                  <div className="text-sm font-mono bg-muted p-2 rounded">
                    MESSAGES_UPSERT, MESSAGES_UPDATE, CONNECTION_UPDATE
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
