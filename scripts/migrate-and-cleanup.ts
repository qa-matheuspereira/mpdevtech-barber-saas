import postgres from "postgres";
import { config } from "dotenv";

config();

async function run() {
    const sql = postgres(process.env.DATABASE_URL!);

    console.log("Adding maxEstablishments column to users table...");
    try {
        await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "maxEstablishments" integer DEFAULT 1 NOT NULL`;
        console.log("✓ Column added successfully.");
    } catch (e: any) {
        if (e.message?.includes("already exists")) {
            console.log("✓ Column already exists, skipping.");
        } else {
            console.error("Error:", e.message);
        }
    }

    console.log("\nDeleting all non-super_admin users...");
    const deleted = await sql`DELETE FROM "users" WHERE "role" != 'super_admin' RETURNING *`;
    console.log(`Deleted ${deleted.length} users.`);
    deleted.forEach((u: any) => console.log(`  - ${u.email} (${u.role})`));

    console.log("\nRemaining users:");
    const remaining = await sql`SELECT id, email, role, "maxEstablishments" FROM "users"`;
    remaining.forEach((u: any) => console.log(`  - ID:${u.id} ${u.email} (${u.role}) max:${u.maxEstablishments}`));

    console.log("\nDone!");
    await sql.end();
    process.exit(0);
}

run();
