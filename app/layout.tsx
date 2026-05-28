import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dawn Honvedseg jelentésíró",
  description: "Discord integrációval működő online jelentésíró felület.",
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
