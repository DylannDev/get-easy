import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Définition du type pour les logs
interface LogEntry {
  timestamp: string;
  message: string;
  details?: unknown;
}

/**
 * Edge Function pour expirer automatiquement les réservations "pending_payment"
 *
 * Cette fonction doit être appelée régulièrement via un CRON job Supabase.
 * Elle trouve toutes les réservations avec:
 * - status = "pending_payment"
 * - expires_at < maintenant
 *
 * Et les marque comme "expired" pour libérer les dates réservées.
 */
Deno.serve(async (_req) => {
  const logs: LogEntry[] = [];

  try {
    // Créer le client Supabase avec les credentials de l'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase credentials in environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const now = new Date().toISOString();
    logs.push({
      timestamp: now,
      message: "Starting expire-bookings cron job",
    });

    // 1. Trouver toutes les réservations "pending_payment" expirées
    const { data: expiredBookings, error: fetchError } = await supabase
      .from("bookings")
      .select("id, customer_id, vehicle_id, start_date, end_date, expires_at")
      .eq("status", "pending_payment")
      .lt("expires_at", now)
      .not("expires_at", "is", null);

    if (fetchError) {
      logs.push({
        timestamp: new Date().toISOString(),
        message: "Error fetching expired bookings",
        details: fetchError,
      });
      throw fetchError;
    }

    logs.push({
      timestamp: new Date().toISOString(),
      message: `Found ${expiredBookings?.length || 0} expired bookings`,
    });

    // 2. Si des réservations expirées sont trouvées, les mettre à jour
    if (expiredBookings && expiredBookings.length > 0) {
      const bookingIds = expiredBookings.map((b) => b.id);

      const { error: updateError, count } = await supabase
        .from("bookings")
        .update({ status: "expired" })
        .in("id", bookingIds);

      if (updateError) {
        logs.push({
          timestamp: new Date().toISOString(),
          message: "Error updating expired bookings",
          details: updateError,
        });
        throw updateError;
      }

      logs.push({
        timestamp: new Date().toISOString(),
        message: `Successfully expired ${count} bookings`,
        details: expiredBookings.map((b) => ({
          id: b.id,
          vehicle_id: b.vehicle_id,
          expires_at: b.expires_at,
        })),
      });
    }

    // 3. Retourner un résumé de l'opération
    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredBookings?.length || 0,
        logs,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    logs.push({
      timestamp: new Date().toISOString(),
      message: "Fatal error in expire-bookings function",
      details: error,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        logs,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
