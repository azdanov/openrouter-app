import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenRouter Chat",
  description: "A chat application powered by OpenRouter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="bg-neutral-800">
          <header className="container mx-auto flex items-center justify-between p-2 md:p-5 text-white">
            <h1 className="text-2xl font-bold">OpenRouter Chat</h1>
            <nav>
              <ul className="flex space-x-5">
                <li>
                  <Link href="/" className="text-neutral-300 hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-neutral-300 hover:text-white"
                  >
                    About
                  </Link>
                </li>
              </ul>
            </nav>
          </header>
        </div>
        <main className="container mx-auto flex flex-col md:flex-row p-2 md:p-5">
          <div className="grow">{children}</div>
        </main>
      </body>
    </html>
  );
}
