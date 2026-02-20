import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Users, Phone, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function BarberManagement() {
  const utils = trpc.useUtils();

  // Fetch user's establishments from API
  const { data: establishments, isLoading: loadingShops } = trpc.establishment.list.useQuery();
  const [selectedestablishmentId, setSelectedestablishmentId] = useState<string>("");

  // Auto-select first barbershop
  const effectiveestablishmentId = selectedestablishmentId
    ? parseInt(selectedestablishmentId)
    : establishments?.[0]?.id ?? 0;

  const { data: barbersList, isLoading: loadingBarbers } = trpc.barbers.list.useQuery(
    { establishmentId: effectiveestablishmentId },
    { enabled: effectiveestablishmentId > 0 }
  );

  const hasestablishments = establishments && establishments.length > 0;

  // Mutations
  const createBarber = trpc.barbers.create.useMutation({
    onSuccess: () => {
      utils.barbers.list.invalidate();
      toast.success("Profissional adicionado com sucesso!");
      setIsDialogOpen(false);
      setFormData({ name: "", phone: "" });
    },
    onError: (err) => toast.error(err.message || "Erro ao criar profissional"),
  });


  const updateBarber = trpc.barbers.update.useMutation({
    onSuccess: () => {
      utils.barbers.list.invalidate();
      toast.success("Profissional atualizado com sucesso!");
      setIsDialogOpen(false);
      setFormData({ name: "", phone: "" });
      setEditingBarberId(null);
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar profissional"),
  });

  const deleteBarber = trpc.barbers.delete.useMutation({
    onSuccess: () => {
      utils.barbers.list.invalidate();
      toast.success("Profissional removido com sucesso!");
    },
    onError: (err) => toast.error(err.message || "Erro ao remover profissional"),
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBarberId, setEditingBarberId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "" });

  const handleOpenDialog = (barber?: { id: number; name: string; phone: string | null }) => {
    if (barber) {
      setEditingBarberId(barber.id);
      setFormData({ name: barber.name, phone: barber.phone || "" });
    } else {
      setEditingBarberId(null);
      setFormData({ name: "", phone: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSaveBarber = () => {
    if (!formData.name.trim()) {
      toast.error("Por favor, digite o nome do profissional");
      return;
    }

    if (editingBarberId) {
      updateBarber.mutate({
        barberId: editingBarberId,
        establishmentId: effectiveestablishmentId,
        name: formData.name,
        phone: formData.phone || undefined,
      });
    } else {
      createBarber.mutate({
        establishmentId: effectiveestablishmentId,
        name: formData.name,
        phone: formData.phone || undefined,
      });
    }
  };

  const handleDeleteBarber = (barberId: number) => {
    deleteBarber.mutate({
      barberId,
      establishmentId: effectiveestablishmentId,
    });
  };

  const isMutating = createBarber.isPending || updateBarber.isPending;
  const activeBarbers = barbersList?.length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Profissionais</h1>
            <p className="text-muted-foreground mt-2">Gerencie os profissionais do seu estabelecimento</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barbershop-select">Estabelecimento</Label>
            {loadingShops ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
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

        {!loadingShops && !hasestablishments && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Você precisa criar um estabelecimento antes de adicionar profissionais.
                  <a href="/settings" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                    Ir para Configurações
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Profissionais</p>
                  <p className="text-3xl font-bold">{activeBarbers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-3xl font-bold">{activeBarbers}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Barber Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              disabled={loadingShops || !effectiveestablishmentId}
            >
              <Plus className="w-4 h-4" />
              Adicionar Profissional
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBarberId ? "Editar Profissional" : "Adicionar Novo Profissional"}
              </DialogTitle>
              <DialogDescription>
                {editingBarberId
                  ? "Atualize as informações do profissional"
                  : "Preencha os dados do novo profissional"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Ex: João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="Ex: (11) 98765-4321"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveBarber}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isMutating}
                >
                  {isMutating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : editingBarberId ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Barbers List */}
        <div className="space-y-4">
          {loadingBarbers ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Carregando profissionais...</p>
              </CardContent>
            </Card>
          ) : !barbersList?.length ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Nenhum profissional cadastrado</p>
              </CardContent>
            </Card>
          ) : (
            barbersList.map((barber) => (
              <Card key={barber.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {barber.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{barber.name}</h3>
                          {barber.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {barber.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        Ativo
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(barber)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBarber(barber.id)}
                        disabled={deleteBarber.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Services Assignment Section */}
        {barbersList && barbersList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Atribuição de Serviços</CardTitle>
              <CardDescription>
                Configure quais serviços cada profissional pode realizar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Selecione um profissional para configurar seus serviços
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
