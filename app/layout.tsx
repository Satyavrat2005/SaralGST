import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saral GST',
  description: 'Intelligent GST Compliance & ITC Maximization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
