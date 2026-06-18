import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wire & Wireless — Portal',
  description: 'Internal portal for Wire & Wireless systems',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
