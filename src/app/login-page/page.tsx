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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await attemptLogin(email, password);

    setLoading(false);

    if (result.ok) {
      router.push("/auth/admin/dashboard");
    } else {
      setError(result.error.message);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F5A623] p-4 font-sans flex items-center justify-center">
      <div className="relative w-full max-w-[340px] rounded-[16px] bg-[#F6F2D9] p-[clamp(20px,4vw,32px)] pt-[clamp(36px,6vw,48px)] flex flex-col gap-3 shadow-sm">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-md">
            <Image
              src="/parcomm-logo.png"
              alt="ParComm"
              width={48}
              height={48}
              className="translate-x-[2.5px] object-contain"
            />
          </div>
        </div>

        <h1 className="mt-2 text-center text-[clamp(16px,2vw,19px)] font-bold text-black">
          Administration Portal
        </h1>

        <form onSubmit={handleLogin} className="mt-2 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[clamp(11px,1.3vw,13px)] font-medium text-black">
              Email Address
            </label>
            <input
              type="text"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ParComm@cpu.edu.ph"
              className="rounded-[8px] border border-[#E8C97A] bg-[#FDFBF0] px-3 py-2 text-[clamp(11px,1.3vw,13px)] text-[#111111] outline-none placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[clamp(11px,1.3vw,13px)] font-medium text-black">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-[8px] border border-[#E8C97A] bg-[#FDFBF0] px-3 py-2 pr-10 text-[clamp(11px,1.3vw,13px)] text-[#111111] outline-none placeholder:text-gray-400"
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
            <p className="text-center text-[clamp(10px,1.1vw,12px)] text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-[10px] bg-[#F5A623] py-2.5 text-[clamp(12px,1.4vw,14px)] font-semibold text-white transition-opacity disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
