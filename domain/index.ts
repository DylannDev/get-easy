/**
 * Domain layer — public barrel.
 *
 * Rules:
 * - Pure TypeScript. No imports from `application/`, `infrastructure/`,
 *   `app/`, `components/`, `hooks/`, `lib/` or any third-party runtime
 *   (Supabase, Stripe, Resend, Next.js, React).
 * - Only types, value objects, entities, domain services and ports.
 */
export * from "./vehicle";
export * from "./agency";
export * from "./organization";
export * from "./booking";
export * from "./customer";
export * from "./payment";
export * from "./shared/date-range.vo";
