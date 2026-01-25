import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPECTRA 8 | 2027 - TRINS",
  description:
    "Eight Years. Eight Events. One Unforgettable Experience. TRINS Annual Cultural Festival 2027.",
  keywords: [
    "SPECTRA",
    "SPECTRA 8",
    "2027",
    "TRINS",
    "Trivandrum International School",
    "cultural festival",
    "arts",
    "entertainment",
  ],
  authors: [{ name: "SPECTRA TRINS" }],
  openGraph: {
    title: "SPECTRA 8 | 2027 - TRINS",
    description:
      "Eight Years. Eight Events. One Unforgettable Experience. TRINS Annual Cultural Festival 2027.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05060A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Skip link for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
