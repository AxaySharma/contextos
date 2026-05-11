// components/SessionProvider.tsx
//
// CLIENT-SIDE SESSION PROVIDER WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
// NextAuth's SessionProvider uses React Context, which requires a Client
// Component. But our root layout.tsx is a Server Component (it fetches the
// session server-side). We solve this by creating this thin wrapper.
//
// The layout passes the pre-fetched session as a prop, so the client
// receives it instantly — no loading flash.

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface Props {
  children: React.ReactNode;
  session: Session | null;
}

export function SessionProvider({ children, session }: Props) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
