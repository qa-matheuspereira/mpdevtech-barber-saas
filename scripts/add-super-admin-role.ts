import postgres from "postgres"; // Using the driver directly
import { config } from "dotenv";

config(); // Load env vars

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL);

    try {
        console.log("Adding 'super_admin' to role enum...");
        await sql.unsafe(`ALTER TYPE "role" ADD VALUE IF NOT EXISTS 'super_admin';`);
        console.log("Success.");
    } catch (e: any) {
        console.error("Error executing statement:", e.message);
    }

    await sql.end();
}

run();
