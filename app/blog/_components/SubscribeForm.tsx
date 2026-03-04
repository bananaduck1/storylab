"use client";

import { useActionState } from "react";
import { subscribeEmail } from "../actions";

type SubscribeState = { success: true } | { error: string } | null;

export default function SubscribeForm() {
  const [state, formAction, isPending] = useActionState<
    SubscribeState,
    FormData
  >(subscribeEmail, null);

  if (state && "success" in state) {
    return (
      <p className="text-emerald-800 text-lg text-center py-4">
        You&rsquo;re in. Welcome to the conversation.
      </p>
    );
  }

  return (
    <form action={formAction}>
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          name="email"
          required
          placeholder="your@email.com"
          className="flex-1 px-4 py-3 border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 rounded-lg focus:outline-none focus:border-zinc-500 text-base"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-950 transition-colors disabled:opacity-60 text-base whitespace-nowrap"
        >
          {isPending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {state && "error" in state && (
        <p className="text-red-600 text-sm mt-3 text-center">{state.error}</p>
      )}
    </form>
  );
}
