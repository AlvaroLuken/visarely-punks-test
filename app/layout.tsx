import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { getConfig } from './wagmi'
import { Providers } from './providers'

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
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(
    getConfig(),
    headers().get('cookie'),
  )

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers initialState={initialState}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
