import { handlers } from "@/lib/auth";

// NextAuth API Route Handler
// Demonstrates: Route Handlers with catch-all segments [...nextauth]
// This handles all auth-related API routes: /api/auth/signin, /api/auth/signout, etc.

export const { GET, POST } = handlers;

