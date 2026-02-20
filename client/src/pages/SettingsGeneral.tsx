import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, MapPin, Phone, FileText, Plus, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsGeneral() {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  // Fetch establishments
  const { data: establishments, isLoading: loadingShops } = trpc.establishment.list.useQuery();
  const [selectedestablishmentId, setSelectedestablishmentId] = useState<string>("");

  // Determine effective ID
  const effectiveestablishmentId = selectedestablishmentId
    ? parseInt(selectedestablishmentId)
    : establishments?.[0]?.id ?? 0;

  // Fetch details for selected barbershop
  const { data: barbershopDetails, isLoading: loadingDetails } = trpc.establishment.get.useQuery(
    { id: effectiveestablishmentId },
    { enabled: effectiveestablishmentId > 0 }
  );

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    description: "",
    operatingMode: "both" as "queue" | "scheduled" | "both",
  });

  // Sync form data when details load
  useEffect(() => {
    if (barbershopDetails) {
      setFormData({
        name: barbershopDetails.name,
        phone: barbershopDetails.phone,
        whatsapp: barbershopDetails.whatsapp,
        address: barbershopDetails.address || "",
        city: barbershopDetails.city || "",
        state: barbershopDetails.state || "",
        zipCode: barbershopDetails.zipCode || "",
        description: barbershopDetails.description || "",
        operatingMode: (barbershopDetails.operatingMode as any) || "both",
      });
    } else if (effectiveestablishmentId === 0 && !loadingShops) {
      // New barbershop mode
      setFormData({
        name: "",
        phone: "",
        whatsapp: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        description: "",
        operatingMode: "both",
      });
    }
  }, [barbershopDetails, effectiveestablishmentId, loadingShops]);

  // Mutations
  const createEstablishment = trpc.establishment.create.useMutation({
    onSuccess: (data) => {
      utils.barbershop.list.invalidate();
      toast.success("Estabelecimento criado com sucesso!");
      // Select the new barbershop
      // Ideally we would get the ID back and set it, but list refetch should handle it if it's the first one
      if (data?.[0]?.id) {
        setSelectedestablishmentId(data[0].id.toString());
      } else {
        // Fallback if not returned directly in some drivers
        // Re-fetch list
      }
    },
    onError: (err) => toast.error(err.message || "Erro ao criar estabelecimento"),
  });

  const updateEstablishment = trpc.establishment.update.useMutation({
    onSuccess: () => {
      utils.barbershop.get.invalidate({ id: effectiveestablishmentId });
      utils.barbershop.list.invalidate();
      toast.success("Configurações atualizadas com sucesso!");
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar configurações"),
  });

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Nome do estabelecimento é obrigatório");
      return;
    }
    if (!formData.phone) {
      toast.error("Telefone é obrigatório");
      return;
    }
    if (!formData.whatsapp) {
      toast.error("WhatsApp é obrigatório");
      return;
    }

    if (effectiveestablishmentId > 0) {
      updateEstablishment.mutate({
        id: effectiveestablishmentId,
        ...formData,
      });
    } else {
      createEstablishment.mutate({
        ...formData,
        // Default values for time if needed, or handle in backend
        openTime: "09:00",
        closeTime: "18:00",
      });
    }
  };

  const isSaving = createEstablishment.isPending || updateEstablishment.isPending;
  const isCreatingNew = effectiveestablishmentId === 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configurações Gerais</h1>
            <p className="text-muted-foreground mt-2">Gerencie as informações do seu estabelecimento</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barbershop-select">Estabelecimento</Label>
            {loadingShops ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={selectedestablishmentId || (establishments?.[0]?.id?.toString() ?? "")}
                  onValueChange={(val) => {
                    if (val === "new") {
                      setSelectedestablishmentId(""); // Resets effective ID to 0 -> create mode
                    } else {
                      setSelectedestablishmentId(val);
                    }
                  }}
                >
                  <SelectTrigger id="barbershop-select" className="w-64">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {establishments?.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id.toString()}>
                        {shop.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="new" className="text-blue-600 font-medium">
                      + Novo Estabelecimento
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {loadingDetails && effectiveestablishmentId > 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="contact">Contato</TabsTrigger>
              <TabsTrigger value="operations">Operações</TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>{isCreatingNew ? "Novo Estabelecimento" : "Informações do Estabelecimento"}</CardTitle>
                  <CardDescription>Dados básicos sobre seu estabelecimento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Estabelecimento *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Salão do João"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva seu estabelecimento"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Endereço
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="address">Rua e Número *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Ex: Rua das Flores, 123"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Ex: São Paulo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado *</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="Ex: SP"
                          maxLength={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        placeholder="Ex: 01234-567"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Informações de Contato
                  </CardTitle>
                  <CardDescription>Dados para contato com seu estabelecimento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Ex: (11) 3333-3333"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp *</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="Ex: (11) 99999-9999"
                    />
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900">
                      ✓ O WhatsApp será usado para enviar notificações de agendamento aos clientes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Operations Tab */}
            <TabsContent value="operations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Modo de Operação
                  </CardTitle>
                  <CardDescription>Configure como você deseja gerenciar os agendamentos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Modo de Agendamento</Label>
                    <div className="space-y-3">
                      {[
                        {
                          value: "queue",
                          label: "Fila Virtual",
                          description: "Clientes entram em fila e são chamados por ordem de chegada",
                        },
                        {
                          value: "scheduled",
                          label: "Horário Marcado",
                          description: "Clientes agendam para horários específicos",
                        },
                        {
                          value: "both",
                          label: "Ambos",
                          description: "Oferece as duas opções para os clientes escolherem",
                        },
                      ].map((mode) => (
                        <label
                          key={mode.value}
                          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.operatingMode === mode.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                            }`}
                        >
                          <input
                            type="radio"
                            name="operatingMode"
                            value={mode.value}
                            checked={formData.operatingMode === mode.value}
                            onChange={(e) => setFormData({ ...formData, operatingMode: e.target.value as any })}
                            className="w-4 h-4"
                          />
                          <div className="ml-4">
                            <p className="font-semibold">{mode.label}</p>
                            <p className="text-sm text-muted-foreground">{mode.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      💡 Você pode alternar entre os modos a qualquer momento. Recomendamos começar com "Ambos" para oferecer flexibilidade aos clientes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => {
                // Reset form if creating new? Or ignore
              }}>Cancelar</Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Salvando..." : (isCreatingNew ? "Criar Estabelecimento" : "Salvar Alterações")}
              </Button>
            </div>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
