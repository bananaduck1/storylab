CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_user_id_read ON notifications(user_id, read);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "service insert" ON notifications FOR INSERT WITH CHECK (TRUE);
