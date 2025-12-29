import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PoolNym - Návštěvnost bazénu Nymburk",
  description:
    "Sledujte aktuální obsazenost plaveckého bazénu a wellness v Nymburce. Historie návštěvnosti, grafy a statistiky v reálném čase.",
  applicationName: "PoolNym",
  authors: [{ name: "Vojtěch", url: "https://github.com/vojtiskof" }],
  keywords: [
    "Nymburk",
    "bazén",
    "wellness",
    "obsazenost",
    "plavání",
    "sauna",
    "sport",
    "PoolNym",
  ],
  openGraph: {
    title: "PoolNym - Návštěvnost bazénu Nymburk",
    description:
      "Aktuální data o obsazenosti nymburského bazénu a wellness. Podrobné statistiky a historie.",
    url: "https://poolfetch.vercel.app",
    siteName: "PoolNym",
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PoolNym - Návštěvnost bazénu Nymburk",
    description:
      "Sledujte, kolik lidí je právě v bazénu v Nymburce. Přehledné grafy a historie.",
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
