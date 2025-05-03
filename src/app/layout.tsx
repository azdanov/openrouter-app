import AuthButton from "./components/AuthButton";
import "./globals.css";
import { signIn, signOut, auth } from "@/auth";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="bg-neutral-800">
          <header className="container mx-auto flex items-center justify-between p-2 md:p-5 text-white space-x-16">
            <h1 className="text-2xl font-bold shrink-0">OpenRouter Chat</h1>
            <nav className="flex items-center justify-between w-full">
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
              <div className="flex space-x-5 ml-5 h-9">
                <AuthButton
                  loginAction={async () => {
                    "use server";
                    await signIn();
                  }}
                  logoutAction={async () => {
                    "use server";
                    await signOut();
                  }}
                  session={session}
                />
              </div>
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
