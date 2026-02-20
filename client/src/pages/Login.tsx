import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loginLoading, setLoginLoading] = useState(false);
    const { isAuthenticated, user, loading: authLoading, logout } = useAuth();
    const [, navigate] = useLocation();

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === "super_admin") {
                navigate("/super-admin");
            } else {
                navigate("/dashboard");
            }
        }
    }, [isAuthenticated, user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoginLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "Erro na autenticação");
        } finally {
            setLoginLoading(false);
        }
    };

    // Show nothing while auth is still loading to prevent flicker
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    if (isAuthenticated && user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center">
                {/* Logo */}
                <div className="flex items-center justify-center mb-2">
                    <img src="/logo.png" alt="Logo" className="h-[16rem]" />
                </div>

                <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm shadow-2xl w-full">
                    <CardHeader className="text-center space-y-1">
                        <CardTitle className="text-2xl text-white">
                            Entrar
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Acesse seu painel de controle
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loginLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            >
                                {loginLoading ? "Carregando..." : "Entrar"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <p className="py-4 text-center text-xs text-slate-500">Desenvolvido por MP Dev Tech</p>
        </div>
    );
}
