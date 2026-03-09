import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SmoothScrolling from '@/components/SmoothScrolling';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Grizzlywear® — Wear the Wild',
    template: '%s | Grizzlywear®',
  },
  description:
    'Premium fashion for the fearless. Shop new arrivals, men\'s, and women\'s collections at Grizzlywear.',
  keywords: ['fashion', 'streetwear', 'clothing', 'india', 'grizzlywear', 'premium fashion'],
  authors: [{ name: 'Grizzlywear' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://grizzlywear.in',
    siteName: 'Grizzlywear',
    title: 'Grizzlywear® — Wear the Wild',
    description: 'Premium fashion for the fearless.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grizzlywear® — Wear the Wild',
    description: 'Premium fashion for the fearless.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-black min-h-screen">
        <SmoothScrolling>
          <Providers>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </Providers>
        </SmoothScrolling>
      </body>
    </html>
  );
}
