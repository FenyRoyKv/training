"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import db from "@/db";
import { signIn, signOut } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validations";

// Server Actions for Authentication
// Demonstrates: Form handling with Server Actions

export type AuthState = {
  error?: string;
  success?: boolean;
};

export async function register(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate input
  const validatedFields = registerSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.errors[0].message,
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already registered" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate input
  const validatedFields = loginSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.errors[0].message,
    };
  }

  try {
    await signIn("credentials", {
      email: rawData.email,
      password: rawData.password,
      redirect: false,
    });
  } catch {
    return { error: "Invalid email or password" };
  }

  redirect("/dashboard");
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

