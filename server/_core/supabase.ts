import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[Supabase] SUPABASE_URL or SUPABASE_ANON_KEY is not configured!");
}

// Server-side Supabase client (for verifying tokens)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// Admin Supabase client (for creating users via Admin API)
export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null;

if (!supabaseServiceRoleKey) {
    console.warn("[Supabase] SUPABASE_SERVICE_ROLE_KEY not configured! Admin user creation will not work.");
}

/**
 * Verify a Supabase access token and return the user.
 */
export async function verifySupabaseToken(accessToken: string) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
        return null;
    }
    return data.user;
}
