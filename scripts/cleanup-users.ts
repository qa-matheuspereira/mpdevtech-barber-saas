import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { ne } from "drizzle-orm";
import { config } from "dotenv";

config();

async function run() {
    const db = await getDb();
    if (!db) {
        console.error("Database unavailable");
        process.exit(1);
    }

    console.log("Deleting all non-super_admin users...");

    const deleted = await db.delete(users)
        .where(ne(users.role, "super_admin"))
        .returning();

    console.log(`Deleted ${deleted.length} users.`);

    if (deleted.length > 0) {
        deleted.forEach(u => console.log(`  - ${u.email} (${u.role})`));
    }

    console.log("Done. Only super_admin users remain.");
    process.exit(0);
}

run();
