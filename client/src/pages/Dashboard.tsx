import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, MoreVertical } from "lucide-react";
import EditEstablishmentModal from "@/components/EditEstablishmentModal";
import WhatsappSessionManager from "@/components/WhatsappSessionManager";

export default function Dashboard() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    description: "",
    openTime: "09:00",
    closeTime: "18:00",
  });

  const { data: establishments, isLoading, refetch: refetchestablishments } = trpc.establishment.list.useQuery();
  const createMutation = trpc.establishment.create.useMutation();

  const handleCreateEstablishment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.whatsapp) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...formData,
        closedDays: [],
      });

      toast.success("Estabelecimento criado com sucesso!");
      refetchestablishments();
      setFormData({
        name: "",
        phone: "",
        whatsapp: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        description: "",
        openTime: "09:00",
        closeTime: "18:00",
      });
      setIsCreating(false);
    } catch (error) {
      toast.error("Erro ao criar estabelecimento");
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bem-vindo, {user?.name}!</h1>
            <p className="text-muted-foreground mt-2">Gerencie seus estabelecimentos e agendamentos</p>
          </div>

          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Estabelecimento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Estabelecimento</DialogTitle>
                <DialogDescription>
                  Preencha os dados do seu estabelecimento para começar
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateEstablishment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Estabelecimento *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Minha Empresa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp *</Label>
                    <Input
                      id="whatsapp"
                      placeholder="(11) 99999-9999"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    placeholder="Rua, número"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      placeholder="São Paulo"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      placeholder="SP"
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      placeholder="01310-100"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openTime">Horário de Abertura</Label>
                    <Input
                      id="openTime"
                      type="time"
                      value={formData.openTime}
                      onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closeTime">Horário de Fechamento</Label>
                    <Input
                      id="closeTime"
                      type="time"
                      value={formData.closeTime}
                      onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva seu estabelecimento..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Estabelecimento"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* establishments Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : establishments && establishments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {establishments.map((shop) => (
              <Card key={shop.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{shop.name}</CardTitle>
                  <CardDescription>{shop.city}, {shop.state}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Telefone:</span> {shop.phone}</p>
                    <p><span className="font-semibold">WhatsApp:</span> {shop.whatsapp}</p>
                    <p><span className="font-semibold">Horário:</span> {shop.openTime} - {shop.closeTime}</p>
                    <p><span className="font-semibold">Modo:</span>
                      {shop.operatingMode === "queue" && " Fila"}
                      {shop.operatingMode === "scheduled" && " Agendamento"}
                      {shop.operatingMode === "both" && " Fila + Agendamento"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      setSelectedEstablishment(shop);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                    Gerenciar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Você ainda não tem nenhum estabelecimento cadastrado</p>
                <Button onClick={() => setIsCreating(true)}>Criar Primeiro Estabelecimento</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Establishment Modal */}
        {selectedEstablishment && (
          <EditEstablishmentModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            establishment={selectedEstablishment}
            onSuccess={() => {
              refetchestablishments();
              setSelectedEstablishment(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}


