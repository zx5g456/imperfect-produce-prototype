import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    'https://fresh-choice-imperfect-produce-7255.limike999999.chatgpt.site',
  ),
  title: 'Fresh Choice — Imperfect Produce Research Prototype',
  description:
    'A controlled shopping prototype for evaluating imperfect produce labels, price clarity and savings framing.',
  openGraph: {
    title: 'Fresh Choice — Imperfect Produce Research Prototype',
    description:
      'Compare clear product labels, quality information, prices and savings in a controlled shopping prototype.',
    images: [
      {
        url: 'https://fresh-choice-imperfect-produce-7255.limike999999.chatgpt.site/og.png',
        width: 1200,
        height: 630,
        alt: 'Fresh Choice imperfect produce research prototype',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fresh Choice — Imperfect Produce Research Prototype',
    description:
      'Compare clear product labels, quality information, prices and savings in a controlled shopping prototype.',
    images: [
      'https://fresh-choice-imperfect-produce-7255.limike999999.chatgpt.site/og.png',
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
