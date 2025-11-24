import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Charger les variables d'environnement depuis .env.local
config({ path: ".env.local" });

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Client Supabase avec service role key pour bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log("🔍 Vérification des tables...\n");

  // Vérifier la table customers
  console.log("📋 Vérification de la table 'customers'...");
  const { data: customersData, error: customersError } = await supabase
    .from("customers")
    .select("*")
    .limit(1);

  if (customersError) {
    console.error("❌ Erreur sur la table 'customers':", customersError.message);
    console.log("   → La table n'existe probablement pas. Exécutez la migration SQL.\n");
  } else {
    console.log("✅ Table 'customers' existe!");
    console.log(`   → ${customersData?.length || 0} enregistrement(s) trouvé(s)\n`);
  }

  // Vérifier la table bookings
  console.log("📋 Vérification de la table 'bookings'...");
  const { data: bookingsData, error: bookingsError } = await supabase
    .from("bookings")
    .select("*")
    .limit(1);

  if (bookingsError) {
    console.error("❌ Erreur sur la table 'bookings':", bookingsError.message);
    console.log("   → La table n'existe probablement pas. Exécutez la migration SQL.\n");
  } else {
    console.log("✅ Table 'bookings' existe!");
    console.log(`   → ${bookingsData?.length || 0} enregistrement(s) trouvé(s)\n`);
  }

  // Résumé
  if (!customersError && !bookingsError) {
    console.log("✅ Toutes les tables nécessaires existent!\n");
    console.log("Vous pouvez maintenant tester la création de réservations.");
  } else {
    console.log("\n⚠️  Action requise:");
    console.log("1. Ouvrez Supabase Dashboard → SQL Editor");
    console.log("2. Copiez le contenu de 'supabase/migrations/create_customers_and_bookings.sql'");
    console.log("3. Exécutez la requête SQL");
    console.log("4. Relancez ce script pour vérifier\n");
  }
}

checkTables().catch(console.error);
