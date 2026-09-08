import type { Metadata } from 'next';
import './globals.css';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://fresh-choice-imperfect-produce.zx5g456.workers.dev';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Fresh Choice — Imperfect Produce Research Prototype',
  description:
    'A controlled shopping prototype for evaluating imperfect produce labels, price clarity and savings framing.',
  openGraph: {
    title: 'Fresh Choice — Imperfect Produce Research Prototype',
    description:
      'Compare clear product labels, quality information, prices and savings in a controlled shopping prototype.',
    images: [
      {
        url: `${siteUrl}/og.png`,
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
    images: [`${siteUrl}/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
