import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Parkering i Borettslaget Lille Rosenlund",
  description: "Book ledige gjesteparkeringsplasser i Borettslaget Lille Rosenlund",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no" className={publicSans.variable}>
      <body className="min-h-screen font-sans antialiased">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-semibold tracking-tight">
            Parkering i Borettslaget Lille Rosenlund
          </h1>
          {children}
        </div>
      </body>
    </html>
  );
}
