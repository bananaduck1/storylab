import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const literata = localFont({
  src: [
    { path: "../public/Literata/Literata-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/Literata/Literata-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/Literata/Literata-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/Literata/Literata-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-literata",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ivystorylab.com"),
  title: {
    default: "StoryLab",
    template: "%s · StoryLab",
  },
  description:
    "Elite humanities training and college applications support—reading, writing, and thinking skills taught by trained humanities graduates.",
  openGraph: {
    title: "StoryLab",
    description:
      "Elite humanities training and college applications support—reading, writing, and thinking skills taught by trained humanities graduates.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "StoryLab",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`${literata.variable} min-h-dvh text-zinc-900 antialiased`}>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-zinc-900 focus:shadow"
        >
          Skip to content
        </a>
        <div className="flex min-h-dvh flex-col">
          <Navbar />
          <main id="content" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
