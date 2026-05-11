// app/unauthorized/page.tsx

import Link from "next/link";
import { ShieldOff } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-navy-950">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto mb-6">
          <ShieldOff className="w-10 h-10 text-red-400" strokeWidth={1.5} />
        </div>

        <h1 className="font-display text-4xl font-semibold text-slate-100 mb-3">
          Access Restricted
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-2">
          ContextOS is a private internal platform. Access is restricted to
          authorised personnel only.
        </p>
        <p className="text-slate-500 text-xs mb-8">
          Your account has not been granted access. Please contact your firm administrator.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/api/auth/signin"
            className="px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm transition-colors duration-150"
          >
            Sign in with a different account
          </Link>
          <Link
            href="/api/auth/signout"
            className="px-6 py-3 rounded-xl border border-navy-600 hover:border-navy-500 text-slate-400 hover:text-slate-300 text-sm transition-colors duration-150"
          >
            Sign out
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-600">
          If you believe this is an error, contact your firm administrator.
        </p>
      </div>
    </div>
  );
}