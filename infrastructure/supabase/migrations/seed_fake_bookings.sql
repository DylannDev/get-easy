-- ⚠️ SEED DATA — À exécuter dans le SQL Editor de Supabase pour tester l'UI.
-- Supprimez ces données après les tests.
-- Nécessite au moins 1 customer et 1 vehicle existants.

DO $$
DECLARE
  v_customer_id uuid;
  v_vehicle_id uuid;
  v_agency_id uuid;
  i int;
  v_statuses text[] := ARRAY['paid', 'paid', 'paid', 'pending_payment', 'cancelled', 'refunded', 'expired', 'payment_failed', 'paid', 'paid'];
  v_status text;
BEGIN
  -- Récupère le premier customer, vehicle et agency existants
  SELECT id INTO v_customer_id FROM customers LIMIT 1;
  SELECT id INTO v_vehicle_id FROM vehicles LIMIT 1;
  SELECT id INTO v_agency_id FROM agencies LIMIT 1;

  IF v_customer_id IS NULL OR v_vehicle_id IS NULL OR v_agency_id IS NULL THEN
    RAISE EXCEPTION 'Il faut au moins 1 customer, 1 vehicle et 1 agency en base.';
  END IF;

  FOR i IN 1..30 LOOP
    v_status := v_statuses[1 + (i % array_length(v_statuses, 1))];

    INSERT INTO bookings (customer_id, vehicle_id, agency_id, start_date, end_date, total_price, status, created_at)
    VALUES (
      v_customer_id,
      v_vehicle_id,
      v_agency_id,
      (now() - (i * interval '2 days') + interval '10 hours')::timestamptz,
      (now() - (i * interval '2 days') + interval '3 days 10 hours')::timestamptz,
      999,
      v_status,
      now() - (i * interval '1 day')
    );
  END LOOP;
END $$;
