"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().regex(passwordRegex, { message: "Password must be at least 8 chars, 1 upper, 1 lower, 1 number, 1 special character" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-[var(--background)]">
      <div className="glass p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">Welcome Back</h1>
          <p className="text-[var(--text-secondary)]">Sign in to your SettleSync account</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 p-3 rounded-lg mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--text-primary)]">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-[var(--error)] text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--text-primary)]">Password</label>
            <input
              {...register("password")}
              type="password"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-[var(--error)] text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--primary)] text-white p-3 rounded-lg font-medium hover:bg-[var(--secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[var(--accent)] hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
