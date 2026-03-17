-- Add session_phase to conversations for admin observability.
-- Stores the inferred phase of the most recent turn (written by chat/route.ts after() block).
-- DEFAULT 'opening' keeps existing rows valid without a backfill.
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS session_phase TEXT NOT NULL DEFAULT 'opening';
