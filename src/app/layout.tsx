import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pulse WiFi - Seamless Public WiFi',
  description:
    'Connect once, stay connected everywhere in participating venues with Pulse WiFi. Free public WiFi with Passpoint 2.0 technology for seamless, secure connectivity.',
  keywords: ['wifi', 'passpoint', 'hotspot 2.0', 'southsea', 'public wifi', 'seamless wifi'],
  authors: [{ name: 'Pulse WiFi' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
