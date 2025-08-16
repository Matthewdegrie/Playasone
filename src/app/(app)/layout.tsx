// src/app/layout.tsx
export const metadata = {
  title: 'PlayAsOne',
  description: 'PlayAsOne app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl"> {/* vaste waarde, niet dynamisch */}
      <body className="min-h-dvh bg-white">{children}</body>
    </html>
  );
}