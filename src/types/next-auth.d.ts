import { DefaultSession } from "next-auth";

// Type augmentation for NextAuth session
// Adds user.id to the session type

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

