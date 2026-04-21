import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

function isTokenRejected(error: unknown): boolean {
  if (!(error instanceof TRPCClientError)) return false;
  const code = (error.data as any)?.code;
  return code === "UNAUTHORIZED" || code === "FORBIDDEN";
}

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const signingOut = useRef(false);

  // Listen to Supabase auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch the local DB user when we have a session
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!session && !signingOut.current,
  });

  const logout = useCallback(async () => {
    signingOut.current = true;
    await supabase.auth.signOut();
    setSession(null);
    signingOut.current = false;
    window.location.href = "/login";
  }, []);

  // Auto sign-out only when the token is explicitly rejected (401/403).
  // Server errors (500, missing env vars, DB down) are surfaced via `error`
  // instead of silently kicking the user out.
  useEffect(() => {
    if (
      session &&
      meQuery.error &&
      !meQuery.isLoading &&
      !signingOut.current &&
      isTokenRejected(meQuery.error)
    ) {
      console.warn("[Auth] Token rejected by server. Signing out.");
      signingOut.current = true;
      supabase.auth.signOut().then(() => {
        setSession(null);
        signingOut.current = false;
        window.location.href = "/login";
      });
    }
  }, [session, meQuery.error, meQuery.isLoading]);

  const state = useMemo(() => {
    if (signingOut.current) {
      return {
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        session: null,
      };
    }
    const user = session ? (meQuery.data ?? null) : null;
    const authError = meQuery.error && !meQuery.isLoading ? meQuery.error : null;
    return {
      user,
      loading: loading || (!!session && meQuery.isLoading),
      error: authError,
      isAuthenticated: Boolean(session) && !authError && !!user,
      session,
    };
  }, [session, meQuery.data, meQuery.error, meQuery.isLoading, loading]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (session) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, loading, session]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
