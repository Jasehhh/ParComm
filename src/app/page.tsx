"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const SPLASH_MS = 2200;

export default function FlashScreen() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/login-page");
    const timer = setTimeout(() => router.push("/login-page"), SPLASH_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main
      onClick={() => router.push("/login-page")}
      className="bg-sand-50 relative flex min-h-screen w-full cursor-pointer flex-col items-center justify-center overflow-hidden p-6"
    >
      {/* Soft brand wash behind the mark */}
      <div
        aria-hidden="true"
        className="bg-brand-100 pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-60"
      />

      <div className="animate-grow-logo relative flex flex-col items-center">
        <Image
          src="/parcomm-logo-full.png"
          alt="ParComm"
          width={240}
          height={240}
          className="w-[min(58vw,240px)] object-contain"
          priority
        />
        <p className="text-ink-700 mt-1 text-sm font-medium">Look for place. Occupy space.</p>
      </div>

      <div className="bg-sand-200 absolute bottom-16 h-1 w-28 overflow-hidden rounded-full">
        <div
          className="bg-brand-400 h-full w-full origin-left rounded-full"
          style={{ animation: `pc-progress ${SPLASH_MS}ms linear both` }}
        />
      </div>

      <p className="text-ink-400 absolute bottom-8 text-[11px] font-medium">
        Central Philippine University
      </p>
    </main>
  );
}
