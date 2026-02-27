// Lab has its own minimal layout — no public Navbar/Footer
export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-white text-zinc-900 font-mono">
      {children}
    </div>
  );
}
