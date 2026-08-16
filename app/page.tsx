"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function FlashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/user");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className={`${inter.variable} min-h-screen w-full flex flex-col items-center justify-center gap-2`}
      style={{ fontFamily: "var(--font-inter)", backgroundColor: "#F6F2D9" }}
    >
      <Image
        src="/parcomm-logo-full.png"
        alt="ParComm"
        width={220}
        height={220}
        className="object-contain"
        priority
      />

      <p className="text-[clamp(11px,1.4vw,14px)] text-black/70 -mt-2">
        Look for place. Occupy space.
      </p>
    </div>
  );
}