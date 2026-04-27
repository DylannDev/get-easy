-- =============================================================================
-- Enable Row Level Security on all public tables
-- =============================================================================
--
-- Why:
--   Without RLS, anyone with the public anon key (exposed in NEXT_PUBLIC_*)
--   can query PostgREST directly:
--     curl "https://<project>.supabase.co/rest/v1/customers?select=*" \
--       -H "apikey: <anon_key>"
--   → leaks every customer/booking/invoice in the database (GDPR critical).
--
-- How this works:
--   - The application uses createAdminClient() (service_role) for ALL queries.
--   - The service_role bypasses RLS automatically — the app continues to work.
--   - The anon role is used ONLY for auth.getUser()/signInWithPassword (auth API,
--     not PostgREST). It never queries public.* tables.
--   - ENABLE RLS without any policy = deny-all for anon/authenticated.
--   - If we ever need client-side reads later (e.g. an admin dashboard with
--     React Query hitting Supabase directly), add a policy like:
--       CREATE POLICY "admin can read" ON public.<table> FOR SELECT
--       USING (auth.uid() IN (SELECT id FROM admin_profiles));
--
-- Idempotent: safe to re-run.
-- =============================================================================

-- Multi-tenant root + auth
ALTER TABLE public.organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles   ENABLE ROW LEVEL SECURITY;

-- Agencies + fleet
ALTER TABLE public.agencies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_periods  ENABLE ROW LEVEL SECURITY;

-- Clients + bookings
ALTER TABLE public.customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_contract_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments               ENABLE ROW LEVEL SECURITY;

-- Options
ALTER TABLE public.options          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_options  ENABLE ROW LEVEL SECURITY;

-- Quotes
ALTER TABLE public.quotes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_options    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_sequences  ENABLE ROW LEVEL SECURITY;

-- Documents (factures, devis, contrats, EDL)
ALTER TABLE public.documents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sequences      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents     ENABLE ROW LEVEL SECURITY;

-- Inspection (états des lieux)
ALTER TABLE public.inspection_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos      ENABLE ROW LEVEL SECURITY;
