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

/**
 * Return the existing Stripe Connect Express account ID for this teacher,
 * or create a new Express account and persist its ID to teachers.
 *
 * Returns the acct_xxx string.
 */
export async function getOrCreateConnectAccount(
  teacherId: string,
  teacherEmail: string
): Promise<string> {
  // Recheck DB to avoid race condition with concurrent onboard calls
  const { data: teacher } = await getSupabase()
    .from("teachers")
    .select("stripe_account_id")
    .eq("id", teacherId)
    .single();

  if (teacher?.stripe_account_id) return teacher.stripe_account_id;

  const account = await getStripe().accounts.create({
    type: "express",
    email: teacherEmail,
    metadata: { teacher_id: teacherId },
  });

  const { error: writeError } = await getSupabase()
    .from("teachers")
    .update({ stripe_account_id: account.id })
    .eq("id", teacherId);

  if (writeError) {
    // Unique constraint violation: a concurrent call already wrote an account ID.
    // Re-read to get the winner and return that instead of the orphaned one we just created.
    if ((writeError as { code?: string }).code === "23505") {
      const { data: fresh } = await getSupabase()
        .from("teachers")
        .select("stripe_account_id")
        .eq("id", teacherId)
        .single();
      if (fresh?.stripe_account_id) return fresh.stripe_account_id;
    }
    throw writeError;
  }

  return account.id;
}
