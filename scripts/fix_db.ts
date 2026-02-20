
import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL not found");
    process.exit(1);
}

const sql = postgres(connectionString);

async function main() {
    try {
        console.log("Applying manual schema fixes...");

        // Add columns to whatsappInstances if they don't exist
        await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsappInstances' AND column_name = 'apiUrl') THEN
          ALTER TABLE "whatsappInstances" ADD COLUMN "apiUrl" varchar(255);
          RAISE NOTICE 'Added apiUrl column';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsappInstances' AND column_name = 'webhookSecret') THEN
          ALTER TABLE "whatsappInstances" ADD COLUMN "webhookSecret" varchar(255);
           RAISE NOTICE 'Added webhookSecret column';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsappInstances' AND column_name = 'aiConfig') THEN
          ALTER TABLE "whatsappInstances" ADD COLUMN "aiConfig" jsonb;
           RAISE NOTICE 'Added aiConfig column';
        END IF;
      END $$;
    `;

        console.log("Schema fixes applied successfully.");
    } catch (error) {
        console.error("Error applying fixes:", error);
    } finally {
        await sql.end();
    }
}

main();
