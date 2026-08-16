// app/guard/vehicle-tracking/generate/result/page.tsx
"use client";

import { Suspense, useMemo } from "react";
import { ArrowLeft, Share2 } from "lucide-react";
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

  const ticketId = useMemo(
    () => `GUEST-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`,
    []
  );
  const validUntil = useMemo(
    () => formatValidUntil(new Date(Date.now() + 6 * 60 * 60 * 1000)),
    []
  );

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "ParComm QR Code", text: plate });
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm h-[700px] max-h-[85vh] bg-[#FBC02D] rounded-3xl p-5 flex flex-col">
        <button
          onClick={() => router.push("/guard/vehicle-tracking/generate")}
          className="flex items-center gap-2 text-black font-bold"
        >
          <ArrowLeft size={20} />
          <span>Generate QR Code</span>
        </button>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full bg-[#F5F5DC] rounded-2xl p-6 shadow-sm flex flex-col items-center">
            <p className="text-2xl font-bold leading-none">
              <span className="text-black">Par</span>
              <span className="text-[#C62828]">Comm</span>
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
          className="mx-auto flex items-center gap-2 text-sm font-medium text-gray-800"
        >
          <Share2 size={16} />
          <span>Share QR</span>
        </button>
      </div>
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
