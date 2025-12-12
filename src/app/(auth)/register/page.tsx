"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/actions/auth";

// Register Page
// Demonstrates: Client Component with form validation and server action

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(register, {});

  useEffect(() => {
    if (state.success) {
      router.push("/login?registered=true");
    }
  }, [state.success, router]);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-slate-300">Start organizing your tasks today</p>
      </div>

      <form action={formAction} className="space-y-6">
        {state.error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
            {state.error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-2">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-slate-400">Must be at least 6 characters</p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-slate-300">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
          Sign in
        </Link>
      </p>
    </div>
  );
}

