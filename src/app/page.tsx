import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Landing Page
// Demonstrates: Server component with auth check

export default async function HomePage() {
  const session = await auth();

  // Redirect to dashboard if already logged in
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-600/30">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>

        {/* Hero */}
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
          TaskFlow
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          A beautifully simple todo app built with Next.js 15. Organize your tasks, 
          track your progress, and get things done.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/register"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/30"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition border border-white/20"
          >
            Sign In
          </Link>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-6 text-left">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Fast & Simple</h3>
            <p className="text-slate-400">Create, update, and complete tasks with a clean, intuitive interface.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure</h3>
            <p className="text-slate-400">Your data is protected with industry-standard authentication.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Priority Levels</h3>
            <p className="text-slate-400">Organize tasks by priority to focus on what matters most.</p>
          </div>
        </div>

        {/* Tech Stack Badge */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <p className="text-sm text-slate-500 mb-4">Built with modern technologies</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400">Next.js 15</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400">React 19</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400">NextAuth v5</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400">Prisma ORM</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400">Tailwind CSS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
