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
      <p className="text-sage text-lg text-center py-4">
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
          className="flex-1 px-4 py-3 border border-line bg-white text-forest placeholder:text-muted rounded-lg focus:outline-none focus:border-sage text-base"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 bg-forest text-white rounded-lg hover:bg-ink transition-colors disabled:opacity-60 text-base whitespace-nowrap"
        >
          {isPending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {state && "error" in state && (
        <p className="text-red-500 text-sm mt-3 text-center">{state.error}</p>
      )}
    </form>
  );
}
