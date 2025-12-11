import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPECTRA 8 | 2026 - TRINS",
  description:
    "Eight Years. Eight Events. One Unforgettable Experience. Hosted by Trivandrum International School.",
  keywords: [
    "SPECTRA",
    "2026",
    "TRINS",
    "Trivandrum International School",
    "cultural festival",
    "arts",
    "entertainment",
  ],
  authors: [{ name: "SPECTRA TRINS" }],
  openGraph: {
    title: "SPECTRA 8 | 2026 - TRINS",
    description:
      "Eight Years. Eight Events. One Unforgettable Experience. Hosted by Trivandrum International School.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
