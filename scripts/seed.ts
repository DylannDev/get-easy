// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { organizations } from "../data/vehicles";
import type { Database } from "../lib/supabase/database.types";

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
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * Nettoie toutes les tables dans l'ordre inverse des dépendances
 */
async function cleanDatabase() {
  console.log("🧹 Nettoyage de la base de données...");

  try {
    // Ordre important : supprimer les dépendances d'abord
    await supabase.from("pricing_tiers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("  ✅ pricing_tiers nettoyé");

    await supabase.from("blocked_periods").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("  ✅ blocked_periods nettoyé");

    await supabase.from("vehicles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("  ✅ vehicles nettoyé");

    await supabase.from("agencies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("  ✅ agencies nettoyé");

    await supabase.from("organizations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("  ✅ organizations nettoyé");

    console.log("✅ Base de données nettoyée avec succès\n");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
    throw error;
  }
}

/**
 * Insère une organisation
 */
async function insertOrganization(org: typeof organizations[0]) {
  console.log(`📦 Insertion de l'organisation: ${org.name}`);

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: org.name,
    })
    .select()
    .single();

  if (error || !data) {
    console.error(`  ❌ Erreur lors de l'insertion de l'organisation:`, error);
    throw error || new Error("Aucune donnée retournée");
  }

  console.log(`  ✅ Organisation insérée: ${data.name} (${data.id})`);
  return data;
}

/**
 * Insère une agence
 */
async function insertAgency(
  agency: typeof organizations[0]["agencies"][0],
  organizationId: string
) {
  console.log(`  📍 Insertion de l'agence: ${agency.name} - ${agency.city}`);

  const { data, error } = await supabase
    .from("agencies")
    .insert({
      organization_id: organizationId,
      name: agency.name,
      city: agency.city,
      address: agency.address,
      open_time: agency.hours.openTime,
      close_time: agency.hours.closeTime,
      interval: agency.hours.interval,
    })
    .select()
    .single();

  if (error || !data) {
    console.error(`    ❌ Erreur lors de l'insertion de l'agence:`, error);
    throw error || new Error("Aucune donnée retournée");
  }

  console.log(`    ✅ Agence insérée: ${data.name} (${data.id})`);
  return data;
}

/**
 * Insère un véhicule
 */
async function insertVehicle(
  vehicle: typeof organizations[0]["agencies"][0]["vehicles"][0],
  agencyId: string
) {
  console.log(
    `    🚗 Insertion du véhicule: ${vehicle.brand} ${vehicle.model} (${vehicle.registrationPlate})`
  );

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      agency_id: agencyId,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      price_per_day: vehicle.pricePerDay,
      transmission: vehicle.transmission,
      fuel_type: vehicle.fuelType,
      number_of_seats: vehicle.numberOfSeats,
      number_of_doors: vehicle.numberOfDoors,
      trunk_size: vehicle.trunkSize,
      year: vehicle.year,
      registration_plate: vehicle.registrationPlate,
      quantity: vehicle.quantity,
      img: vehicle.img,
    })
    .select()
    .single();

  if (error || !data) {
    console.error(`      ❌ Erreur lors de l'insertion du véhicule:`, error);
    throw error || new Error("Aucune donnée retournée");
  }

  console.log(`      ✅ Véhicule inséré: ${data.brand} ${data.model}`);
  return data;
}

/**
 * Insère les périodes bloquées d'un véhicule
 */
async function insertBlockedPeriods(
  vehicleId: string,
  blockedPeriods: typeof organizations[0]["agencies"][0]["vehicles"][0]["blockedPeriods"]
) {
  if (!blockedPeriods || blockedPeriods.length === 0) {
    console.log(`      ℹ️  Aucune période bloquée`);
    return;
  }

  console.log(
    `      🚫 Insertion de ${blockedPeriods.length} période(s) bloquée(s)`
  );

  const periodsToInsert = blockedPeriods.map((period) => ({
    vehicle_id: vehicleId,
    start: period.start,
    end: period.end,
  }));

  const { data, error } = await supabase
    .from("blocked_periods")
    .insert(periodsToInsert)
    .select();

  if (error) {
    console.error(
      `        ❌ Erreur lors de l'insertion des périodes bloquées:`,
      error
    );
    throw error;
  }

  console.log(`        ✅ ${data.length} période(s) bloquée(s) insérée(s)`);
  return data;
}

/**
 * Insère les paliers tarifaires d'un véhicule
 */
async function insertPricingTiers(
  vehicleId: string,
  pricingTiers: typeof organizations[0]["agencies"][0]["vehicles"][0]["pricingTiers"]
) {
  if (!pricingTiers || pricingTiers.length === 0) {
    console.log(`      ℹ️  Aucun palier tarifaire`);
    return;
  }

  console.log(
    `      💰 Insertion de ${pricingTiers.length} palier(s) tarifaire(s)`
  );

  const tiersToInsert = pricingTiers.map((tier) => ({
    vehicle_id: vehicleId,
    min_days: tier.minDays,
    price_per_day: tier.pricePerDay,
  }));

  const { data, error } = await supabase
    .from("pricing_tiers")
    .insert(tiersToInsert)
    .select();

  if (error) {
    console.error(
      `        ❌ Erreur lors de l'insertion des paliers tarifaires:`,
      error
    );
    throw error;
  }

  console.log(`        ✅ ${data.length} palier(s) tarifaire(s) inséré(s)`);
  return data;
}

/**
 * Fonction principale de seed
 */
async function seed() {
  console.log("🌱 Démarrage du seed...\n");

  try {
    // 1. Nettoyer la base de données
    await cleanDatabase();

    // 2. Parcourir toutes les organisations
    for (const org of organizations) {
      // 2.1. Insérer l'organisation
      const insertedOrg = await insertOrganization(org);

      // 2.2. Parcourir toutes les agences de l'organisation
      for (const agency of org.agencies) {
        // 2.2.1. Insérer l'agence
        const insertedAgency = await insertAgency(agency, insertedOrg.id);

        // 2.2.2. Parcourir tous les véhicules de l'agence
        for (const vehicle of agency.vehicles) {
          // 2.2.2.1. Insérer le véhicule
          const insertedVehicle = await insertVehicle(
            vehicle,
            insertedAgency.id
          );

          // 2.2.2.2. Insérer les périodes bloquées
          await insertBlockedPeriods(
            insertedVehicle.id,
            vehicle.blockedPeriods
          );

          // 2.2.2.3. Insérer les paliers tarifaires
          await insertPricingTiers(insertedVehicle.id, vehicle.pricingTiers);
        }
      }
    }

    console.log("\n✅ Seed terminé avec succès!");
    console.log("\n📊 Résumé:");
    console.log(`  - ${organizations.length} organisation(s)`);
    console.log(
      `  - ${organizations.reduce((acc, org) => acc + org.agencies.length, 0)} agence(s)`
    );
    console.log(
      `  - ${organizations.reduce(
        (acc, org) =>
          acc +
          org.agencies.reduce(
            (sum, agency) => sum + agency.vehicles.length,
            0
          ),
        0
      )} véhicule(s)`
    );
  } catch (error) {
    console.error("\n❌ Erreur lors du seed:", error);
    process.exit(1);
  }
}

// Exécuter le seed
seed();
