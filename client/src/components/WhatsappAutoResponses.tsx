import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Edit2,
  Plus,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface AutoResponseFormData {
  trigger: string;
  response: string;
  category: string;
  priority: number;
}

interface WhatsappAutoResponsesProps {
  establishmentId: number;
}

export function WhatsappAutoResponses({
  establishmentId,
}: WhatsappAutoResponsesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AutoResponseFormData>({
    trigger: "",
    response: "",
    category: "",
    priority: 0,
  });

  // Queries
  const { data: responses, isLoading, refetch } = trpc.webhook.getAutoResponses.useQuery({
    establishmentId,
  });

  // Mutations
  const createMutation = trpc.webhook.createAutoResponse.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
      setIsOpen(false);
    },
  });

  const updateMutation = trpc.webhook.updateAutoResponse.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
      setIsOpen(false);
    },
  });

  const deleteMutation = trpc.webhook.deleteAutoResponse.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setFormData({
      trigger: "",
      response: "",
      category: "",
      priority: 0,
    });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (response: any) => {
    setFormData({
      trigger: response.trigger,
      response: response.response,
      category: response.category || "",
      priority: response.priority || 0,
    });
    setEditingId(response.id);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.trigger.trim() || !formData.response.trim()) {
      alert("Por favor, preencha os campos obrigatórios");
      return;
    }

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        ...formData,
      });
    } else {
      await createMutation.mutateAsync({
        establishmentId,
        ...formData,
      });
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync({ id: deleteId });
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "confirmation":
        return "bg-green-100 text-green-800";
      case "cancellation":
        return "bg-red-100 text-red-800";
      case "question":
        return "bg-blue-100 text-blue-800";
      case "complaint":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      confirmation: "Confirmação",
      cancellation: "Cancelamento",
      question: "Dúvida",
      complaint: "Reclamação",
    };
    return labels[category || ""] || "Outro";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Respostas Automáticas</h2>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Resposta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Resposta" : "Nova Resposta Automática"}
              </DialogTitle>
              <DialogDescription>
                Configure uma resposta automática para mensagens do WhatsApp
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Trigger */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Palavra-chave (obrigatório)
                </label>
                <Input
                  placeholder="Ex: oi, olá, horário, preço"
                  value={formData.trigger}
                  onChange={(e) =>
                    setFormData({ ...formData, trigger: e.target.value })
                  }
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  A resposta será acionada quando a mensagem contiver essa
                  palavra-chave
                </p>
              </div>

              {/* Response */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Resposta (obrigatório)
                </label>
                <Textarea
                  placeholder="Digite a resposta automática..."
                  value={formData.response}
                  onChange={(e) =>
                    setFormData({ ...formData, response: e.target.value })
                  }
                  rows={4}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Máximo 1000 caracteres
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <option value="">Selecionar categoria...</option>
                  <option value="confirmation">Confirmação</option>
                  <option value="cancellation">Cancelamento</option>
                  <option value="question">Dúvida</option>
                  <option value="complaint">Reclamação</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Respostas com maior prioridade são usadas primeiro
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : editingId
                      ? "Atualizar"
                      : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      {!responses || responses.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-lg mb-2">
            Nenhuma resposta automática configurada
          </h3>
          <p className="text-muted-foreground mb-4">
            Crie sua primeira resposta automática para começar a automatizar
            suas respostas no WhatsApp
          </p>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeira Resposta
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {responses.map((response) => (
            <Card key={response.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Trigger */}
                  <div className="flex items-center gap-2 mb-2">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {response.trigger}
                    </code>
                    {response.category && (
                      <Badge className={getCategoryColor(response.category)}>
                        {getCategoryLabel(response.category)}
                      </Badge>
                    )}
                    {response.priority && response.priority > 0 && (
                      <Badge variant="secondary">
                        Prioridade: {response.priority}
                      </Badge>
                    )}
                  </div>

                  {/* Response Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {response.response}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEdit(response)}
                    disabled={
                      createMutation.isPending ||
                      updateMutation.isPending ||
                      deleteMutation.isPending
                    }
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(response.id)}
                        disabled={
                          createMutation.isPending ||
                          updateMutation.isPending ||
                          deleteMutation.isPending
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir resposta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta resposta automática?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="bg-muted p-3 rounded-md my-4">
                        <p className="text-sm font-mono">{response.trigger}</p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Como funciona?</p>
            <p>
              Quando um cliente enviar uma mensagem contendo a palavra-chave,
              o sistema automaticamente responderá com a mensagem configurada.
              Respostas com maior prioridade serão usadas primeiro.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
