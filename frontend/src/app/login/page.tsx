"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Invalid email or password. Please check and try again.");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant p-8">
          {/* Branding */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-3 mb-2">
              <img src="/logo.png" alt="LeaveSync" className="h-9 w-auto" />
              <h1 className="text-2xl font-bold text-primary">LeaveSync</h1>
            </Link>
            <p className="text-on-surface-variant text-sm">Leave Management System</p>
          </div>

          {/* Success banner */}
          {showSuccess && (
            <div className="mb-4 p-3 bg-primary-fixed border border-primary-fixed-dim/50 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <p className="text-sm text-on-primary-fixed">Account created successfully! Please sign in.</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-on-surface mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-on-surface placeholder:text-on-surface-variant/50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-on-surface placeholder:text-on-surface-variant/50"
              />
            </div>

            {error && (
              <div className="p-3 bg-error-container border border-error/20 rounded-lg">
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-sm text-on-surface-variant">or</span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>

          {/* Link to signup */}
          <p className="text-center text-sm text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:text-primary-container font-medium hover:underline">
              Create one
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-primary-fixed/50 rounded-lg border border-primary-fixed-dim/50">
            <p className="text-xs font-medium text-on-primary-fixed mb-2">Demo Credentials:</p>
            <p className="text-xs text-on-primary-fixed-variant">Admin: admin@leavesync.com</p>
            <p className="text-xs text-on-primary-fixed-variant">User: alice@leavesync.com</p>
            <p className="text-xs text-on-primary-fixed-variant">Password: password123</p>
          </div>
        </div>        </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
