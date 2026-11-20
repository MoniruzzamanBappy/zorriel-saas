import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Zorriel", description: "Run your shop: billing, stock and online orders" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-muted/40">{children}</body>
    </html>
  );
}
