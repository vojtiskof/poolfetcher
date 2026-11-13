import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0284c7",
};

export const metadata: Metadata = {
  title: "PoolNym — Návštěvnost bazénů Nymburk a Mladá Boleslav",
  description:
    "Sledujte aktuální obsazenost plaveckého bazénu Relaxační centrum Labe v Nymburce a bazénu Sokolovna v Mladé Boleslavi. Přehledné grafy, historie a nejlepší čas k návštěvě.",
  applicationName: "PoolNym",
  authors: [{ name: "Vojtěch", url: "https://github.com/vojtiskof" }],
  keywords: [
    "Nymburk",
    "Mladá Boleslav",
    "bazén",
    "Relaxační centrum Labe",
    "Sokolovna MB",
    "obsazenost",
    "návštěvnost",
    "plavání",
    "PoolNym",
  ],
  openGraph: {
    title: "PoolNym — Návštěvnost bazénů Nymburk a MB",
    description:
      "Aktuální obsazenost bazénů v Nymburce a Mladé Boleslavi. Podrobné statistiky, porovnání dnů a historie.",
    siteName: "PoolNym",
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PoolNym — Návštěvnost bazénů Nymburk a MB",
    description:
      "Sledujte, kolik lidí je právě v bazénu v Nymburce a Mladé Boleslavi. Přehledné grafy a historie.",
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
    <html lang="cs" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-slate-50 text-slate-900 selection:bg-sky-100 selection:text-sky-900`}
        suppressHydrationWarning
      >
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
