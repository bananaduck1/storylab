-- Session consent gate (TODO-51).
--
-- Students must explicitly agree to the session recording/processing notice
-- before a Daily.co meeting token is issued. The token route enforces this
-- server-side (client modal alone is not enough — a student could call the
-- token endpoint directly without going through the UI).
--
-- Also adds:
--   • recordings_consent on student_profiles — student can withdraw consent
--     to session recordings at any time via the Data Rights Center.
--     Withdrawing blocks future token issuance (teacher path unaffected).
--   • deleted_at on conversations — soft delete for Data Rights Center.

-- ── session_consents ────────────────────────────────────────────────────────
CREATE TABLE session_consents (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consented_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  agreement_version TEXT        NOT NULL DEFAULT '1.0',
  ip_address        TEXT,
  UNIQUE(session_id, user_id)
);

CREATE INDEX session_consents_session_id_idx ON session_consents(session_id);
CREATE INDEX session_consents_user_id_idx   ON session_consents(user_id);

ALTER TABLE session_consents ENABLE ROW LEVEL SECURITY;

-- Students can insert and read their own consent rows.
-- Service role (used by token/consent API routes) bypasses RLS.
CREATE POLICY session_consents_insert_own
  ON session_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY session_consents_select_own
  ON session_consents FOR SELECT
  USING (auth.uid() = user_id);

-- ── recordings_consent on student_profiles ─────────────────────────────────
-- Default TRUE — existing students implicitly consent until they withdraw.
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS recordings_consent BOOLEAN NOT NULL DEFAULT true;

-- ── soft delete on conversations ────────────────────────────────────────────
-- Hard delete is deferred (TODO). deleted_at=NULL means not deleted.
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX conversations_deleted_at_idx ON conversations(deleted_at)
  WHERE deleted_at IS NULL;
