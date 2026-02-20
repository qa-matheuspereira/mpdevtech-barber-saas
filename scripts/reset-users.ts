import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

async function run() {
    const sql = postgres(process.env.DATABASE_URL!);
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Delete all users from Supabase Auth
    console.log("Listing all Supabase Auth users...");
    const { data: authUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) {
        console.error("Error listing auth users:", listErr.message);
    } else {
        for (const u of authUsers.users) {
            console.log(`  Deleting auth user: ${u.email} (${u.id})`);
            await supabaseAdmin.auth.admin.deleteUser(u.id);
        }
        console.log(`✓ Deleted ${authUsers.users.length} auth users.`);
    }

    // 2. Delete all users from local DB
    console.log("\nDeleting all users from local DB...");
    const deleted = await sql`DELETE FROM "users" RETURNING *`;
    console.log(`✓ Deleted ${deleted.length} local DB users.`);

    // 3. Create new super admin in Supabase Auth
    const email = "admin@admin.com";
    const password = "admin123456";

    console.log(`\nCreating super admin: ${email}...`);
    const { data: newAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Super Admin" },
    });

    if (createErr || !newAuth.user) {
        console.error("Error creating auth user:", createErr?.message);
        await sql.end();
        process.exit(1);
    }

    console.log(`✓ Auth user created: ${newAuth.user.id}`);

    // 4. Create in local DB
    const result = await sql`
        INSERT INTO "users" ("openId", "name", "email", "loginMethod", "role", "maxEstablishments", "createdAt", "updatedAt", "lastSignedIn")
        VALUES (${newAuth.user.id}, 'Super Admin', ${email}, 'email', 'super_admin', 999, NOW(), NOW(), NOW())
        RETURNING *
    `;

    console.log(`✓ Local DB user created: ID=${result[0].id}, role=${result[0].role}`);
    console.log(`\n=============================`);
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);
    console.log(`=============================`);

    await sql.end();
    process.exit(0);
}

run();
