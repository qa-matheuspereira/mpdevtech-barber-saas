import postgres from "postgres"; // Using the driver directly
import fs from "fs";
import path from "path";
import { config } from "dotenv";

config(); // Load env vars

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL);

    const sqlPath = path.join(process.cwd(), "drizzle/0002_oval_prodigy.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    const statements = sqlContent.split("--> statement-breakpoint");

    console.log(`Found ${statements.length} statements.`);

    for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed) {
            console.log("Executing:", trimmed.substring(0, 50).replace(/\n/g, " ") + "...");
            try {
                await sql.unsafe(trimmed);
                console.log("Success.");
            } catch (e: any) {
                console.error("Error executing statement:", e.message);
                // Continue? Or stop?
                // If error is "relation already exists", maybe safe to ignore?
                // But for RENAME, it shouldn't error.
                if (e.code === '42710') { // duplicate_object
                    console.log("Ignoring duplicate object error.");
                } else {
                    console.error(e);
                    // process.exit(1);
                }
            }
        }
    }

    console.log("Migration finished.");
    await sql.end();
}

run();
