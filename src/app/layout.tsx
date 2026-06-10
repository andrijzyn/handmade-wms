import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import React from "react";

export const metadata: Metadata = {
  title: "StockPulse — Inventory Management",
  description: "Система управління складом",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <title></title>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
