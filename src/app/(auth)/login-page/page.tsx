"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { attemptLogin } from "@/lib/authResult";

export default function DashboardLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        setError("Invalid Credentials. Please try again.");
        setLoading(false);
        return;
      }

      const emailValue = user.value.user.email?.toLowerCase();

      if (emailValue === "admin@cpu.edu.ph") {
        router.push("/admin/dashboard");
      } else if (emailValue === "guard@cpu.edu.ph") {
        router.push("/guard");
      } else {
        setError("Invalid Credentials. Please try again.");
      }
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F5A623] p-4 font-sans">
      <div className="relative w-full max-w-[420px] rounded-[24px] bg-[#F6F2D9] px-5 pb-5 pt-[clamp(38px,6vw,52px)] shadow-sm">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2">
          <div className="flex h-25 w-25 items-center justify-center overflow-hidden rounded-full mb bg-white shadow-md">
            <Image
              src="/parcomm-logo.png"
              alt="ParComm"
              width={48}
              height={48}
              className="translate-x-[2.5px] object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <h1 className="text-[clamp(20px,4vw,35px)] font-bold leading-tight text-black">
            Welcome to ParComm
          </h1>
          <p className="mt-1 text-[clamp(14px,2vw,18px)] text-black/70">
            Choose how you&apos;d like to continue.
          </p>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => router.push("/user")}
            className="w-full rounded-[14px] bg-[#F5A623] py-3 text-[clamp(16px,2vw,18px)] font-semibold text-white shadow-sm transition-transform hover:scale-[1.01]"
          >
            Continue as User
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/25" />
          <span className="text-[clamp(9px,1.2vw,11px)] font-medium tracking-[0.16em] text-black/60 uppercase">
            Guard / Admin Sign In
          </span>
          <div className="h-px flex-1 bg-black/25" />
        </div>

        <form onSubmit={handleLogin} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[clamp(14px,1.8vw,16px)] font-medium text-black">
              Email Address
            </label>
            <input
              type="text"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ParComm@cpu.edu.ph"
              className="w-full rounded-[12px] border border-[#D8CDA7] bg-[#E7E0CF] px-3 py-3 text-[clamp(14px,1.8vw,16px)] text-[#111111] outline-none placeholder:text-black/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[clamp(14px,1.8vw,16px)] font-medium text-black">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-[12px] border border-[#D8CDA7] bg-[#E7E0CF] px-3 py-3 pr-11 text-[clamp(14px,1.8vw,16px)] text-[#111111] outline-none placeholder:text-black/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-[#5B5B5B]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" />
                    <path d="M9.88 5.08A10.94 10.94 0 0 1 12 5c4.42 0 8.25 2.52 10 7-1.13 2.76-3.27 5.02-5.92 6.2" />
                    <path d="M14.12 18.92A10.97 10.97 0 0 1 12 19c-4.42 0-8.25-2.52-10-7 1.16-2.82 3.35-5.11 6.06-6.3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-center text-[clamp(11px,1.3vw,13px)] text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-[14px] bg-[#F5A623] py-3 text-[clamp(16px,2vw,18px)] font-semibold text-white transition-opacity disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
