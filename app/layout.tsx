import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DawnNAV jelentésíró",
  description: "DAWN-NAV stílusú jelentésíró felület Discord integrációval.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}
