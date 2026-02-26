import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LayoutWrapper } from "../components/LayoutWrapper";

const cooper = localFont({
  src: [
    {
      path: "../public/Cooper/Cooper-Regular.6fb9bad1f357745da4910ccbbe68aaf5.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/Cooper/Cooper-Medium.41006565ceec0e4607274fa5b71f69f2.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/Cooper/Cooper-SemiBold.a7810b05ed35d81e9bf3afdc39a48472.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/Cooper/Cooper-Bold.0e53a7da2f6cd29baae3289174a84980.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/Cooper/Cooper-ExtraBold.5ed41d8328e0637c5d3230a7a720023b.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-cooper",
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
      <body className={`${cooper.variable} min-h-dvh text-zinc-900 antialiased`}>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-zinc-900 focus:shadow"
        >
          Skip to content
        </a>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
