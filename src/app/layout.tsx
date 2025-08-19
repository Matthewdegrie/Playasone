// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // juist pad: src/app → src/app

export const metadata: Metadata = {
  title: "Play As One",
  description: "PlayAsOne – leagues, games & leaderboards",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}