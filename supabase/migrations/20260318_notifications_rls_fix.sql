-- Drop the overly permissive INSERT policy on notifications.
-- All notification inserts happen server-side via service-role key,
-- which bypasses RLS entirely — no INSERT policy is needed.
-- Leaving it in place allowed any authenticated user to insert notifications
-- for arbitrary user_ids.
DROP POLICY IF EXISTS "service insert" ON notifications;
