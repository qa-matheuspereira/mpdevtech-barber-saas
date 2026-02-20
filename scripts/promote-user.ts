import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { config } from "dotenv";

config();

const email = process.argv[2];

if (!email) {
    console.error("Please provide an email address as argument.");
    process.exit(1);
}

async function run() {
    const db = await getDb();
    if (!db) {
        console.error("Database unavailable");
        process.exit(1);
    }

    console.log(`Promoting user ${email} to super_admin...`);

    const result = await db.update(users)
        .set({ role: "super_admin" })
        .where(eq(users.email, email))
        .returning();

    if (result.length === 0) {
        console.error("User not found.");
    } else {
        console.log("Success! User promoted:", result[0]);
    }

    process.exit(0);
}

run();
