import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lab",
  description: "StoryLab Lab — coming soon.",
};

export default function Lab() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-6 bg-paper/90 backdrop-blur-[1px]">
        <section className="flex min-h-[60vh] flex-col items-center justify-center py-16 sm:py-20 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Lab
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-600">
            Coming soon.
          </p>
        </section>
      </div>
    </div>
  );
}
