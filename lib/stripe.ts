import Stripe from "stripe";
import { getSupabase } from "@/lib/supabase";

let _stripe: Stripe | null = null;

// Lazy singleton — initializes only when first called (not at build time)
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * Return the existing Stripe customer ID for this user, or create a new
 * Stripe customer and persist the ID to student_profiles.
 *
 * Extracted from subscribe/route.ts and topup/route.ts to avoid duplication.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string | null | undefined,
  fullName: string,
  existingCustomerId: string | null | undefined
): Promise<string> {
  if (existingCustomerId) return existingCustomerId;

  const customer = await getStripe().customers.create({
    email: email ?? undefined,
    name: fullName,
    metadata: { user_id: userId },
  });

  await getSupabase()
    .from("student_profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("user_id", userId);

  return customer.id;
}
