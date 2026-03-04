"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "../actions";

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    startTransition(async () => {
      await deletePost(id);
      router.push("/admin/dashboard");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-40 transition-colors"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
