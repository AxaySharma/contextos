// app/layout.tsx
//
// ROOT LAYOUT
// This wraps every page in the application.
// It sets up:
//  1. Google Fonts (loaded via CSS in globals.css)
//  2. SessionProvider so every component can access auth state
//  3. HTML metadata

import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "ContextOS | Document Intelligence",
  description:
    "Private document intelligence platform for strategic advisory professionals.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch the session server-side so SessionProvider can hydrate immediately
  // without a loading flash. This is the recommended Next.js 14 pattern.
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="antialiased">
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
