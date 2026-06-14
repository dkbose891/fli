import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NSW Property Agent',
  description:
    'Ask about NSW land parcels in plain English. Grounded in the live NSW Cadastre via a Gemini agent on Vertex AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
