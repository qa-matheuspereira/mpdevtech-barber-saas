import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

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
    // Navigate to login page immediately to avoid 404 flash
    window.location.href = "/login";
  }, []);

  // Auto sign-out if session exists but user was deleted from DB
  useEffect(() => {
    if (session && meQuery.error && !meQuery.isLoading && !signingOut.current) {
      console.warn("[Auth] Session exists but user not found in DB. Signing out.");
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
    const hasError = !!meQuery.error && !meQuery.isLoading;
    return {
      user,
      loading: loading || (!!session && meQuery.isLoading),
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(session) && !hasError && !!user,
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
