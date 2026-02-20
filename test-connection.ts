import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL);

try {
    const result = await sql`SELECT 1 as test`;
    console.log("✅ Connected to Supabase!", result);
} catch (e) {
    console.error("❌ Connection failed:", e.message);
} finally {
    await sql.end();
}
