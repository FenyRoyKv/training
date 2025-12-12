import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

// Dashboard Layout with Parallel Routes
// Demonstrates: 
// - Parallel Routes using @modal slot
// - Protected routes with server-side auth check
// - Route Groups with (dashboard)

type DashboardLayoutProps = {
  children: React.ReactNode;
  modal: React.ReactNode; // Parallel route slot for modals
};

export default async function DashboardLayout({
  children,
  modal,
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">TaskFlow</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-300 text-sm">
              Hello, {session.user.name || session.user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Modal Slot - Parallel Route */}
      {modal}
    </div>
  );
}

