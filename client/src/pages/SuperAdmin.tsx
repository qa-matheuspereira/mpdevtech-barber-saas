import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Shield, Building2, UserPlus, Pencil, Trash2, KeyRound, Copy, LogOut, Info, Calendar, Phone, User, Upload, Workflow, MessageSquare, CheckCircle, Database } from "lucide-react";

// Generate a random password of given length
function generatePassword(length = 12): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export default function SuperAdmin() {
    const { logout, user, loading, isAuthenticated } = useAuth();
    const [, navigate] = useLocation();

    // Redirect non-super_admin users
    useEffect(() => {
        if (!loading && (!isAuthenticated || user?.role !== 'super_admin')) {
            navigate('/login');
        }
    }, [loading, isAuthenticated, user, navigate]);

    const [isUserOpen, setIsUserOpen] = useState(false);
    const [isOwnerInfoOpen, setIsOwnerInfoOpen] = useState(false);
    const [selectedOwner, setSelectedOwner] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: owners, isLoading, refetch } = trpc.admin.listOwners.useQuery();
    const { data: masterWhatsapp } = trpc.whatsapp.getSettings.useQuery();

    const updateEst = trpc.admin.updateEstablishment.useMutation({
        onSuccess: () => {
            toast.success("Estabelecimento atualizado!");
            setIsEditOpen(false);
            refetch();
        },
        onError: (err: any) => toast.error(err.message),
    });

    const deleteEst = trpc.admin.deleteEstablishment.useMutation({
        onSuccess: () => {
            toast.success("Estabelecimento excluído!");
            setDeleteId(null);
            refetch();
        },
        onError: (err: any) => toast.error(err.message),
    });

    const createUser = trpc.admin.createUser.useMutation({
        onSuccess: () => {
            toast.success("Usuário criado com sucesso!");
            setIsUserOpen(false);
            setUserData({ name: "", email: "", password: "", maxEstablishments: "1" });
            refetch();
        },
        onError: (err: any) => toast.error(err.message),
    });

    const [userData, setUserData] = useState({
        name: "",
        email: "",
        password: "",
        maxEstablishments: "1",
    });

    const [editData, setEditData] = useState({
        id: 0,
        name: "",
        phone: "",
        whatsapp: "",
    });

    const handleGeneratePassword = () => {
        setUserData(prev => ({ ...prev, password: generatePassword() }));
    };

    const handleCopyPassword = () => {
        if (userData.password) {
            navigator.clipboard.writeText(userData.password);
            toast.success("Senha copiada!");
        }
    };

    const handleUserSubmit = async () => {
        if (!userData.name.trim()) {
            toast.error("Nome é obrigatório");
            return;
        }
        if (!userData.email.trim()) {
            toast.error("Email é obrigatório");
            return;
        }
        if (!userData.password) {
            toast.error("Gere uma senha antes de cadastrar");
            return;
        }
        createUser.mutate({
            name: userData.name,
            email: userData.email,
            password: userData.password,
            maxEstablishments: parseInt(userData.maxEstablishments),
        });
    };

    const handleEditOpen = (est: any) => {
        setEditData({
            id: est.id,
            name: est.name,
            phone: est.phone || "",
            whatsapp: est.whatsapp || "",
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = async () => {
        updateEst.mutate({
            id: editData.id,
            name: editData.name,
            phone: editData.phone,
            whatsapp: editData.whatsapp,
        });
    };

    const handleUserModalClose = () => {
        setIsUserOpen(false);
        setUserData({ name: "", email: "", password: "", maxEstablishments: "1" });
    };

    const handleOwnerInfoOpen = (owner: any) => {
        setSelectedOwner(owner);
        setIsOwnerInfoOpen(true);
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Database className="h-6 w-6 text-purple-500" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        Super Admin
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setIsUserOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Novo Usuário
                    </Button>
                    <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
                        <LogOut className="mr-2 h-4 w-4" /> Sair
                    </Button>
                </div>
            </div>

            {/* Adicionar Logo */}
            <div className="space-y-3">
                <Label className="text-base">Adicionar Logo</Label>
                <div className="border-2 border-dashed border-border/40 rounded-xl bg-card/50 p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/20 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">Clique para fazer upload ou arraste uma imagem</p>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Máximo 2MB. Recomendado: 200x200px</p>
            </div>

            {/* Automações e Workflows */}
            <div className="pt-6 border-t border-border/20">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        Automações e Workflows
                    </h2>
                    <p className="text-sm text-muted-foreground">Configure fluxos de trabalho automatizados para esta organização</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Workflow className="h-4 w-4" /> Criar Workflow
                </Button>
            </div>

            {/* Instância WhatsApp */}
            <div className="pt-8 border-t border-border/20">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-green-500" />
                            Instância WhatsApp
                        </h2>
                        <p className="text-sm text-muted-foreground">Informações de conexão do WhatsApp desta organização</p>
                    </div>
                </div>

                <div className="space-y-6 max-w-3xl">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <div className="bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Conectado
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border/10">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Nome da Instância:</span>
                            <span className="font-medium text-foreground">{masterWhatsapp?.instanceName || "clinica-youtube"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Empresa:</span>
                            <span className="font-medium text-foreground">Clinica Youtube</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Telefone:</span>
                            <span className="font-medium px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">(11) 98851-6536</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Instance ID:</span>
                            <span className="font-mono text-muted-foreground text-xs">rcc251cb915dee9</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Token:</span>
                            <span className="font-mono text-muted-foreground text-xs">f5880c60-4a09-48b2-bab5-72af7fce2dee</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Criado em:</span>
                            <span className="font-medium">15/01/2026, 15:59:01</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Atualizado em:</span>
                            <span className="font-medium">15/01/2026, 16:03:01</span>
                        </div>
                    </div>

                    <div className="pt-4">
                        <div className="bg-card border border-border/40 rounded-lg p-4 flex items-center gap-3">
                            <div className="p-2 bg-muted/30 flex items-center justify-center rounded-md">
                                <Database className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-medium">Webhook Configurado</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-12 border-t border-border/20">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <User className="h-5 w-5" /> Cadastros da Plataforma
                    </h2>
                    <p className="text-sm text-muted-foreground">Gerencie todos os donos e estabelecimentos do sistema.</p>
                </div>
            </div>

            {/* Owners Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Donos</CardTitle>
                    <CardDescription>Lista de todos os donos cadastrados e seus estabelecimentos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Dono</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Estabelecimentos</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {owners?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        Nenhum dono cadastrado.
                                    </TableCell>
                                </TableRow>
                            )}
                            {owners?.map((owner: any) => (
                                <TableRow key={owner.id}>
                                    <TableCell className="font-mono text-muted-foreground">{owner.id}</TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {owner.name || "—"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{owner.email || "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant={owner.establishments.length >= owner.maxEstablishments ? "destructive" : "secondary"}>
                                            {owner.establishments.length}/{owner.maxEstablishments}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOwnerInfoOpen(owner)}
                                        >
                                            <Info className="mr-2 h-4 w-4" />
                                            Informações
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Owner Info Modal */}
            <Dialog open={isOwnerInfoOpen} onOpenChange={setIsOwnerInfoOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Informações do Dono
                        </DialogTitle>
                    </DialogHeader>
                    {selectedOwner && (
                        <div className="space-y-6">
                            {/* Owner Details */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Nome</p>
                                    <p className="font-medium">{selectedOwner.name || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{selectedOwner.email || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Estabelecimentos permitidos</p>
                                    <p className="font-medium">
                                        <Badge variant={selectedOwner.establishments.length >= selectedOwner.maxEstablishments ? "destructive" : "secondary"}>
                                            {selectedOwner.establishments.length}/{selectedOwner.maxEstablishments}
                                        </Badge>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Cadastrado em</p>
                                    <p className="font-medium">{new Date(selectedOwner.createdAt).toLocaleDateString("pt-BR")}</p>
                                </div>
                            </div>

                            {/* Owner's Establishments */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Estabelecimentos ({selectedOwner.establishments.length})
                                </h3>
                                {selectedOwner.establishments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum estabelecimento cadastrado.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedOwner.establishments.map((est: any) => (
                                            <div key={est.id} className="border rounded-lg p-4 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-primary" />
                                                        <span className="font-medium">{est.name}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => {
                                                                setIsOwnerInfoOpen(false);
                                                                handleEditOpen(est);
                                                            }}
                                                            title="Editar"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => {
                                                                setIsOwnerInfoOpen(false);
                                                                setDeleteId(est.id);
                                                            }}
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{est.whatsapp || "Sem WhatsApp"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{new Date(est.createdAt).toLocaleDateString("pt-BR")}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* New User Modal */}
            <Dialog open={isUserOpen} onOpenChange={(open) => { if (!open) handleUserModalClose(); else setIsUserOpen(true); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Usuário</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                placeholder="Nome do usuário"
                                value={userData.name}
                                onChange={e => setUserData({ ...userData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                placeholder="email@exemplo.com"
                                value={userData.email}
                                onChange={e => setUserData({ ...userData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Senha</Label>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    placeholder="Clique em gerar..."
                                    value={userData.password}
                                    className="font-mono"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGeneratePassword}
                                    title="Gerar senha aleatória"
                                >
                                    <KeyRound className="h-4 w-4" />
                                </Button>
                                {userData.password && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCopyPassword}
                                        title="Copiar senha"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Máximo de Estabelecimentos</Label>
                            <Select
                                value={userData.maxEstablishments}
                                onValueChange={v => setUserData({ ...userData, maxEstablishments: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 estabelecimento</SelectItem>
                                    <SelectItem value="2">2 estabelecimentos</SelectItem>
                                    <SelectItem value="3">3 estabelecimentos</SelectItem>
                                    <SelectItem value="5">5 estabelecimentos</SelectItem>
                                    <SelectItem value="10">10 estabelecimentos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={handleUserModalClose}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUserSubmit} disabled={createUser.isPending}>
                            {createUser.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Cadastrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Establishment Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Estabelecimento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                value={editData.name}
                                onChange={e => setEditData({ ...editData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefone</Label>
                            <Input
                                value={editData.phone}
                                onChange={e => setEditData({ ...editData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>WhatsApp</Label>
                            <Input
                                value={editData.whatsapp}
                                onChange={e => setEditData({ ...editData, whatsapp: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEditSubmit} disabled={updateEst.isPending}>
                            {updateEst.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Estabelecimento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este estabelecimento? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => { if (deleteId) deleteEst.mutate({ id: deleteId }); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
