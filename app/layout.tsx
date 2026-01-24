import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // BURAYA KENDİ SİTE ADRESİNİ YAZ (Sonunda slaş / olmasın)
  metadataBase: new URL('https://ramazan-kumanya.vercel.app'), 
  
  title: "Ramazan Kumanyası",
  description: "İhtiyaç sahiplerine destek olun, iftar sofralarına ortak olun.",
  
  // WhatsApp ve Twitter için açıkça belirtelim
  openGraph: {
    title: "Ramazan Kumanyası",
    description: "İhtiyaç sahiplerine destek olun.",
    url: 'https://ramazan-kumanya.vercel.app',
    siteName: 'Ramazan Kumanyası',
    locale: 'tr_TR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}