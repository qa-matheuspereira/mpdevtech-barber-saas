import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { establishments, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq, desc, ne, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "../_core/supabase";

// Middleware to check if user is super_admin
const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    if (ctx.user?.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a Super Admins" });
    }
    return next();
});

export const adminRouter = router({
    // List all establishments with owner info
    listEstablishments: superAdminProcedure
        .query(async ({ ctx }) => {
            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

            const result = await db.select({
                establishment: establishments,
                owner: {
                    id: users.id,
                    name: users.name,
                    email: users.email,
                }
            })
                .from(establishments)
                .leftJoin(users, eq(establishments.ownerId, users.id))
                .orderBy(desc(establishments.createdAt));

            return result;
        }),

    // Update an establishment (super admin)
    updateEstablishment: superAdminProcedure
        .input(z.object({
            id: z.number(),
            name: z.string().min(1).optional(),
            phone: z.string().optional(),
            whatsapp: z.string().optional(),
            address: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

            const { id, ...updateData } = input;

            const existing = await db.select().from(establishments).where(eq(establishments.id, id));
            if (!existing.length) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

            await db.update(establishments)
                .set({ ...updateData, updatedAt: new Date() })
                .where(eq(establishments.id, id));

            return { success: true };
        }),

    // Delete an establishment (super admin)
    deleteEstablishment: superAdminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

            const existing = await db.select().from(establishments).where(eq(establishments.id, input.id));
            if (!existing.length) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });

            await db.delete(establishments).where(eq(establishments.id, input.id));

            return { success: true };
        }),

    // Create a new user (Owner) — creates in Supabase Auth + local DB
    createUser: superAdminProcedure
        .input(z.object({
            name: z.string().min(1),
            email: z.string().email(),
            password: z.string().min(6),
            maxEstablishments: z.number().min(1).max(50).default(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

            // Check if email already exists in local DB
            const existing = await db.select().from(users).where(eq(users.email, input.email));
            if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });

            let supabaseUserId: string;

            // Create user in Supabase Auth
            if (!supabaseAdmin) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Supabase Admin não configurado. Adicione SUPABASE_SERVICE_ROLE_KEY ao .env",
                });
            }

            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: input.email,
                password: input.password,
                email_confirm: true, // Auto-confirm the email
                user_metadata: {
                    full_name: input.name,
                },
            });

            if (authError || !authData.user) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Erro ao criar usuário no Supabase: ${authError?.message || "Erro desconhecido"}`,
                });
            }

            supabaseUserId = authData.user.id;

            // Create user in local DB
            const [newUser] = await db.insert(users).values({
                email: input.email,
                name: input.name,
                openId: supabaseUserId,
                loginMethod: "email",
                role: "admin",
                maxEstablishments: input.maxEstablishments,
            }).returning();

            return newUser;
        }),

    // List all users (to verify or select owner)
    listUsers: superAdminProcedure
        .query(async () => {
            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

            return db.select().from(users).where(ne(users.role, 'super_admin'));
        }),

    // List owners with their establishments
    listOwners: superAdminProcedure
        .query(async () => {
            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

            // Get all non-super_admin users
            const owners = await db.select().from(users).where(ne(users.role, 'super_admin')).orderBy(desc(users.createdAt));

            // Get all establishments
            const allEstablishments = await db.select().from(establishments).orderBy(desc(establishments.createdAt));

            // Group establishments by owner
            return owners.map(owner => ({
                id: owner.id,
                name: owner.name,
                email: owner.email,
                maxEstablishments: owner.maxEstablishments,
                createdAt: owner.createdAt,
                establishments: allEstablishments.filter(est => est.ownerId === owner.id),
            }));
        }),
});
