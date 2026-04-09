import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY environment variable");
}

/**
 * Low-level Resend SDK instance. Should only be imported from
 * `infrastructure/resend/*` adapters — application and domain layers must
 * depend on `Notifier` from `application/notifications` instead.
 */
export const resend = new Resend(process.env.RESEND_API_KEY);
