import type { ReactNode } from "react";
import { AdminNav } from "./_components/AdminNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white">
      <AdminNav />
      <main>{children}</main>
    </div>
  );
}
