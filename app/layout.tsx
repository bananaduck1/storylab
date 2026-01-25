import type { Metadata } from "next";
import { Literata } from "next/font/google";
import "./globals.css";

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
        {children}
      </body>
    </html>
  );
}
