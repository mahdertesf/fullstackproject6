// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google'; // Import from next/font
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Providers from '@/components/Providers';

// Configure fonts using next/font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // CSS variable for Inter
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk', // CSS variable for Space Grotesk
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CoTBE Portal',
  description: 'Addis Ababa University College of Technology and Built Environment Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Removed direct Google Font links, next/font handles this */}
      </head>
      <body className="font-body antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
