import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "DPPK | Dashboard Program Komuniti KPKT",
  description:
    "Dashboard Perancangan dan Penilaian Program Pembangunan Komuniti — Kementerian Perumahan dan Kerajaan Tempatan (KPKT) Malaysia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body className="antialiased">{children}
      <Toaster />
      <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
