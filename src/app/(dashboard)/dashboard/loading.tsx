// Dashboard Loading State
// Demonstrates: loading.tsx for Suspense boundaries

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="h-4 bg-white/10 rounded w-20 mb-2" />
            <div className="h-8 bg-white/10 rounded w-12" />
          </div>
        ))}
      </div>

      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-white/10 rounded w-40" />
        <div className="h-10 bg-white/10 rounded w-28" />
      </div>

      {/* Todo Cards Skeleton */}
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-white/10 rounded-md" />
              <div className="flex-1">
                <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
                <div className="flex gap-2">
                  <div className="h-6 bg-white/10 rounded w-16" />
                  <div className="h-6 bg-white/10 rounded w-20" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

