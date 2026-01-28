import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main id="content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
