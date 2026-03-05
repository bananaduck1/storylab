"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) setUser(data.user);
      });
  }, []);

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || newEmail === user?.email) return;
    setEmailSaving(true);
    setEmailMessage("");
    setEmailError("");

    const { error } = await getSupabase().auth.updateUser({ email: newEmail });

    if (error) {
      setEmailError(error.message);
    } else {
      setEmailMessage(
        "Confirmation sent to both addresses. Follow the link in each email to confirm the change."
      );
      setNewEmail("");
    }
    setEmailSaving(false);
  }

  async function handleSignOutAll() {
    setSigningOut(true);
    await getSupabase().auth.signOut({ scope: "global" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-dvh bg-white text-zinc-900">
      {/* Top bar */}
      <div className="flex h-10 items-center border-b border-zinc-200 px-4">
        <a
          href="/lab"
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          ← Lab
        </a>
      </div>

      <div className="mx-auto max-w-md px-6 py-10 space-y-10">
        <h1 className="text-sm font-semibold text-zinc-900">Account settings</h1>

        {/* Change email */}
        <section>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Email address
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            Current: <span className="text-zinc-700">{user?.email ?? "—"}</span>
          </p>
          <form onSubmit={handleEmailChange} className="space-y-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setEmailMessage("");
                setEmailError("");
              }}
              placeholder="New email address"
              required
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            />
            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            {emailMessage && (
              <p className="text-xs text-zinc-500">{emailMessage}</p>
            )}
            <button
              type="submit"
              disabled={emailSaving || !newEmail.trim()}
              className="rounded bg-zinc-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
            >
              {emailSaving ? "Sending…" : "Update email"}
            </button>
          </form>
        </section>

        {/* Sign out all devices */}
        <section className="border-t border-zinc-100 pt-8">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Sessions
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            Sign out from all devices and browsers.
          </p>
          <button
            onClick={handleSignOutAll}
            disabled={signingOut}
            className="rounded border border-zinc-300 px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            {signingOut ? "Signing out…" : "Sign out everywhere"}
          </button>
        </section>
      </div>
    </div>
  );
}
