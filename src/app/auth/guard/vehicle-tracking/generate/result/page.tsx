"use client";

import { Suspense, useState } from "react";
import { ChevronLeft, Share2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

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
    <div className="min-h-screen w-full bg-[#F6F2D9] p-4 font-sans flex flex-col gap-[clamp(14px,2.5vw,20px)]">
      <div className="-mx-4 -mt-4 flex items-center gap-2 bg-[#F5A623] px-4 py-4 font-bold text-black">
        <button
          type="button"
          onClick={() => router.push("/auth/guard/vehicle-tracking/generate")}
          className="flex cursor-pointer items-center"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="text-[clamp(15px,2vw,19px)]">Generate QR Code</span>
      </div>

      <div className="flex w-full flex-1 items-center justify-center">
        <div className="flex w-full max-w-[420px] flex-col items-center rounded-[16px] bg-[#FDFBF0] p-[clamp(20px,4vw,28px)] shadow-sm">
          <p className="text-2xl font-bold leading-none">
            <span className="text-[#F5A623]">Par</span>
            <span className="text-[#D2691E]">Comm</span>
          </p>
          <p className="mt-1 mb-4 text-xs text-gray-600">Look for place. Occupy space.</p>
          <QRCodeSVG value={plate} size={180} />
          <p className="mt-4 text-sm font-bold text-gray-900">{ticketId}</p>
          <p className="text-xs text-gray-600">Valid Until: {validUntil}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleShare}
        className="mx-auto flex items-center gap-2 pb-4 text-[clamp(11px,1.3vw,13px)] font-medium text-gray-800"
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
