import AuthButton from "./components/AuthButton";
import "./globals.css";
import { ChatProvider } from "@/app/context/ChatContext";
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
    <html lang="en" className="overflow-y-scroll">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="grid min-h-screen grid-rows-[auto_1fr_auto]">
          <header className="bg-neutral-800">
            <div className="container mx-auto flex items-center justify-between space-x-16 p-2 text-white md:p-5">
              <h1 className="shrink-0 text-2xl font-bold">
                <Link href="/">OpenRouter Chat</Link>
              </h1>
              <nav className="flex w-full items-center justify-between">
                <ul className="flex space-x-5">
                  <li>
                    <Link
                      href="/"
                      className="text-neutral-300 hover:text-white"
                    >
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
                <div className="ml-5 flex h-9 space-x-5">
                  <AuthButton
                    loginAction={async () => {
                      "use server";
                      await signIn();
                    }}
                    logoutAction={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                    session={session}
                  />
                </div>
              </nav>
            </div>
          </header>
          <main className="container mx-auto p-2 md:p-5">
            <ChatProvider userEmail={session?.user?.email || ""}>
              {children}
            </ChatProvider>
          </main>
          <footer className="container mx-auto flex items-center justify-center p-2 text-neutral-500 md:-mt-5 md:p-5">
            <p className="text-center">
              &copy; {new Date().getFullYear()} OpenRouter Chat
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
