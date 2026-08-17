"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function FlashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/user");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-[#F6F2D9] font-sans flex flex-col items-center justify-center gap-2">
      <Image
        src="/parcomm-logo-full.png"
        alt="ParComm"
        width={220}
        height={220}
        className="object-contain"
        priority
      />

      <p className="-mt-2 text-[clamp(11px,1.4vw,14px)] text-black/70">
        Look for place. Occupy space.
      </p>
    </div>
  );
}