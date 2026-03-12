// Lab has its own minimal layout — no public Navbar/Footer
export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh overflow-hidden">
      {children}
    </div>
  );
}
