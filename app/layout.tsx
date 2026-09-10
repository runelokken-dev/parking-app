import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Parkering i borettslaget",
  description: "Book ledige gjesteparkeringsplasser i borettslaget",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no" className={publicSans.variable}>
      <body className="min-h-screen font-sans antialiased">
        <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
