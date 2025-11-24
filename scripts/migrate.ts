import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log("🔄 Running migration...");

  const migrationPath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "create_customers_and_bookings.sql"
  );

  const sql = fs.readFileSync(migrationPath, "utf-8");

  // Split by semicolons and filter out empty statements
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: statement,
      });

      if (error) {
        console.error(`❌ Error executing statement:`, error);
        console.log("Statement:", statement.substring(0, 100) + "...");
      } else {
        console.log("✅ Executed:", statement.substring(0, 50) + "...");
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
    }
  }

  console.log("✅ Migration completed!");
}

runMigration().catch(console.error);
