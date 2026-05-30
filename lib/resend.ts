import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

/**
 * Sender email addresses.
 *
 * In development (no verified domain), Resend requires `onboarding@resend.dev`
 * as the from address and can only send to the account owner's email.
 *
 * In production, set `RESEND_FROM_AUTH` and `RESEND_FROM_WINNERS` env vars
 * with verified domains (e.g. `auth@goldendreandraw.com`).
 */

export const FROM_AUTH =
  process.env.RESEND_FROM_AUTH || "Golden Dream Draw <onboarding@resend.dev>";

export const FROM_WINNERS =
  process.env.RESEND_FROM_WINNERS || "Golden Dream Draw <onboarding@resend.dev>";

export default resend;
