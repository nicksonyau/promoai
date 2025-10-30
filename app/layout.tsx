import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromoAI",
  description: "AI-powered promotions and growth for F&B businesses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  );
}
