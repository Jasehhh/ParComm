"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { attemptLogin } from "@/lib/authResult";
import { Wordmark } from "@/components/Wordmark";

const ROLE_HOME: Record<string, string> = {
  "admin@cpu.edu.ph": "/admin/dashboard",
  "guard@cpu.edu.ph": "/guard",
};

export default function DashboardLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await attemptLogin(email, password);

      if (!user.ok) {
        setError("Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      const destination = ROLE_HOME[user.value.user.email?.toLowerCase() ?? ""];

      if (destination) {
        router.push(destination);
      } else {
        setError("This account is not registered as guard or admin staff.");
      }
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-brand-400 relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Depth wash so the flat amber does not read as a solid block */}
      <div
        aria-hidden="true"
        className="bg-brand-300 pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-70"
      />
      <div
        aria-hidden="true"
        className="bg-brand-600 pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full blur-3xl opacity-30"
      />

      <div className="pc-rise relative w-full max-w-[26rem]">
        <div className="pc-card shadow-raised overflow-hidden">
          <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center sm:px-8">
            <div className="border-sand-200 flex h-16 w-16 items-center justify-center rounded-2xl border bg-white shadow-sm">
              <Image
                src="/parcomm-logo.png"
                alt=""
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>

            <h1 className="text-ink-900 mt-5 text-2xl font-extrabold tracking-tight">
              Welcome to <Wordmark size="lg" className="align-baseline" />
            </h1>
            <p className="text-ink-500 mt-2 text-sm">
              Live parking availability across the CPU campus.
            </p>

            <button
              type="button"
              onClick={() => router.push("/user")}
              className="pc-btn pc-btn-primary mt-6 w-full"
            >
              Continue as student
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => setShowStaffLogin((prev) => !prev)}
              aria-expanded={showStaffLogin}
              className="text-ink-500 hover:text-ink-800 mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <ShieldCheck size={15} />
              {showStaffLogin ? "Hide staff sign in" : "Sign in as guard or admin"}
            </button>
          </div>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              showStaffLogin ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="border-sand-200 bg-sand-50 border-t px-6 py-6 sm:px-8">
                <p className="pc-eyebrow text-center">Staff sign in</p>

                <form onSubmit={handleLogin} className="mt-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-ink-800 text-sm font-medium">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      required={showStaffLogin}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@cpu.edu.ph"
                      className="pc-field"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-ink-800 text-sm font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required={showStaffLogin}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pc-field pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="text-ink-400 hover:text-ink-700 absolute inset-y-0 right-0 flex w-11 items-center justify-center transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="flex items-start gap-2 rounded-[0.625rem] bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700"
                    >
                      <AlertCircle size={15} className="mt-px shrink-0" />
                      {error}
                    </p>
                  )}

                  <button type="submit" disabled={loading} className="pc-btn pc-btn-dark w-full">
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? "Signing in…" : "Log in"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs font-medium text-white/80">
          Central Philippine University · Vehicle Monitoring
        </p>
      </div>
    </main>
  );
}
