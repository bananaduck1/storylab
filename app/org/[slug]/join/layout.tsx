import type { Metadata } from "next";

export const metadata: Metadata = { title: "Join — StoryLab" };

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  // Distraction-free: no Navbar, no Footer. Just the wordmark + content.
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <header className="px-6 py-5">
        <span className="text-[#2C4A3E] text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-cooper)" }}>StoryLab</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {children}
      </main>
    </div>
  );
}
