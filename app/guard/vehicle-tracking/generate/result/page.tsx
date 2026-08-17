"use client";

import { Suspense, useState } from "react";
import { ChevronLeft, Share2, AlertCircle } from "lucide-react";
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
  const rawPlate = searchParams.get("plate") ?? "";
  const plate = rawPlate.trim().toUpperCase();

  const [ticketId] = useState(
    () => `GUEST-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`
  );
  const [validUntil] = useState(
    () => formatValidUntil(new Date(Date.now() + 6 * 60 * 60 * 1000))
  );

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ParComm QR Code",
          text: `Parking Pass for Plate: ${plate}`,
        });
      } catch {
        // Handle potential share dismissal
      }
    }
  };

  return (
    <div
      className={`${inter.variable} min-h-screen w-full p-4 flex flex-col gap-[clamp(14px,2.5vw,20px)]`}
      style={{ fontFamily: "var(--font-inter)", backgroundColor: "#F6F2D9" }}
    >
      <div className="-mx-4 -mt-4 flex items-center gap-2 bg-[#F5A623] px-4 py-4 text-black font-bold">
        <button
          type="button"
          onClick={() => router.push("/guard/vehicle-tracking/generate")}
          className="flex cursor-pointer items-center"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="text-[clamp(15px,2vw,19px)]">Generated QR Code</span>
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-full max-w-105 bg-[#FDFBF0] rounded-2xl p-[clamp(20px,4vw,28px)] shadow-sm flex flex-col items-center">
          <p className="text-2xl font-bold leading-none">
            <span style={{ color: "#F5A623" }}>Par</span>
            <span style={{ color: "#D2691E" }}>Comm</span>
          </p>
          <p className="text-xs text-gray-600 mt-1 mb-4">
            Look for place. Occupy space.
          </p>

          {plate ? (
            <>
              <div className="p-3 bg-white rounded-xl shadow-xs border border-amber-100 mb-3">
                <QRCodeSVG value={plate} size={180} />
              </div>

              <div className="my-2 px-4 py-1.5 rounded-full bg-stone-200 text-stone-900 font-mono text-sm font-bold tracking-wider">
                {plate}
              </div>

              <p className="mt-2 text-sm font-bold text-gray-900">{ticketId}</p>
              <p className="text-xs text-gray-600 mt-0.5">Valid Until: {validUntil}</p>
            </>
          ) : (
            <div className="py-8 text-center text-red-600 space-y-2">
              <AlertCircle size={32} className="mx-auto" />
              <p className="text-sm font-medium">No valid plate number provided.</p>
              <button
                type="button"
                onClick={() => router.push("/guard/vehicle-tracking/generate")}
                className="text-xs text-amber-700 underline font-semibold cursor-pointer"
              >
                Go back and enter plate number
              </button>
            </div>
          )}
        </div>
      </div>

      {plate && (
        <button
          onClick={handleShare}
          className="mx-auto flex items-center gap-2 text-[clamp(11px,1.3vw,13px)] font-medium text-gray-800 pb-4 cursor-pointer hover:opacity-80 transition"
        >
          <Share2 size={16} />
          <span>Share QR</span>
        </button>
      )}
    </div>
  );
}

export default function GenerateQRCodeResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-[#F6F2D9]" />}>
      <ResultContent />
    </Suspense>
  );
}