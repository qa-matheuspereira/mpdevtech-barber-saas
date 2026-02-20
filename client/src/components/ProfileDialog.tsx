import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z
    .object({
        oldPassword: z.string().min(1, "A senha atual é obrigatória"),
        newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
        confirmPassword: z.string().min(1, "Confirme a nova senha"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
    });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfileDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: PasswordFormValues) => {
        if (!user?.email) return;

        setIsLoading(true);
        try {
            // 1. Re-authenticate to verify old password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: data.oldPassword,
            });

            if (signInError) {
                throw new Error("Senha atual incorreta");
            }

            // 2. Update to new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: data.newPassword,
            });

            if (updateError) {
                throw updateError;
            }

            toast.success("Senha alterada com sucesso!");
            form.reset();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Erro ao alterar a senha");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Meu Perfil</DialogTitle>
                    <DialogDescription>
                        Visualize seus dados e altere sua senha.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Dados Pessoais</h3>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-semibold col-span-1">Nome:</span>
                            <span className="text-sm col-span-3 truncate">{user?.name || "-"}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-semibold col-span-1">Email:</span>
                            <span className="text-sm col-span-3 truncate">{user?.email || "-"}</span>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">Alterar Senha</h3>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="oldPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Senha Atual</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Digite sua senha atual" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nova Senha</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Digite a nova senha" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirmar Nova Senha</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Confirme a nova senha" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Atualizar Senha
                                </Button>
                            </form>
                        </Form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
