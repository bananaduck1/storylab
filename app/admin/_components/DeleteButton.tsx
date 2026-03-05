"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "../actions";

export default function DeleteButton({
  id,
  slug,
  title,
}: {
  id: string;
  slug: string;
  title: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deletePost(id, slug);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
    >
      {isPending ? "…" : "Delete"}
    </button>
  );
}
