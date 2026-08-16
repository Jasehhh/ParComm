// app/guard/vehicle-tracking/generate/result/page.tsx
"use client";

import { Suspense, useState } from "react";
import { ChevronLeft, Share2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const formatValidUntil = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }) +
  " • " +
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plate = searchParams.get("plate") ?? "";

  const [ticketId] = useState(
    () => `GUEST-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`
  );
  const [validUntil] = useState(
    () => formatValidUntil(new Date(Date.now() + 6 * 60 * 60 * 1000))
  );

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "ParComm QR Code", text: plate });
    }
  };

  return (
    <div
      className={`${inter.variable} min-h-screen w-full p-4 flex flex-col gap-[clamp(14px,2.5vw,20px)]`}
      style={{ fontFamily: "var(--font-inter)", backgroundColor: "#F6F2D9" }}
    >
      <button
        onClick={() => router.push("/guard/vehicle-tracking/generate")}
        className="-mx-4 -mt-4 flex items-center gap-2 bg-[#F5A623] px-4 py-4 text-black font-bold"
      >
        <ChevronLeft size={22} />
        <span className="text-[clamp(15px,2vw,19px)]">Generate QR Code</span>
      </button>

      <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-full max-w-[420px] bg-[#FDFBF0] rounded-[16px] p-[clamp(20px,4vw,28px)] shadow-sm flex flex-col items-center">
          <p className="text-2xl font-bold leading-none">
            <span style={{ color: "#F5A623" }}>Par</span>
            <span style={{ color: "#D2691E" }}>Comm</span>
          </p>
          <p className="text-xs text-gray-600 mt-1 mb-4">
            Look for place. Occupy space.
          </p>
          <QRCodeSVG value={plate} size={180} />
          <p className="mt-4 text-sm font-bold text-gray-900">{ticketId}</p>
          <p className="text-xs text-gray-600">Valid Until: {validUntil}</p>
        </div>
      </div>

      <button
        onClick={handleShare}
        className="mx-auto flex items-center gap-2 text-[clamp(11px,1.3vw,13px)] font-medium text-gray-800 pb-4"
      >
        <Share2 size={16} />
        <span>Share QR</span>
      </button>
    </div>
  );
}

export default function GenerateQRCodeResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultContent />
    </Suspense>
  );
}
