import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Web3Provider } from "./components/Web3Provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Visarely Punks",
  description: "A generative art collection merging Victor Vasarely's optical art mastery with CryptoPunks' iconic aesthetic.",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'Visarely Punks',
    description: 'A generative art collection merging Vasarely with CryptoPunks',
    images: [
      {
        url: '/preview1.svg',
        width: 1200,
        height: 630,
        alt: 'Visarely Punks Preview',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Visarely Punks',
    description: 'A generative art collection merging Vasarely with CryptoPunks',
    images: ['/og-image.jpg'],
    creator: '@lifeofbitcoin',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  )
}