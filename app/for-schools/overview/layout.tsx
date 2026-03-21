// Print-optimized layout: no Navbar, no Footer.
// Overrides the root layout for /for-schools/overview only.
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
