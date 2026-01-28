import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { PageTransition } from "../../components/PageTransition";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main id="content" className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
