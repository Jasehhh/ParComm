"use client";

import { Suspense, useState, useEffect } from "react";
import { ChevronLeft, Printer } from "lucide-react";
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
  
  const ticketId = searchParams.get("ticketId") ?? "ERROR";
  const [validUntil, setValidUntil] = useState("");

  useEffect(() => {
    setValidUntil(formatValidUntil(new Date(Date.now() + 10 * 60 * 60 * 1000)));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    // Added 'print:bg-white' so it doesn't print a giant yellow block
    <div className="min-h-screen w-full bg-[#F5A623] print:bg-white p-4 font-sans flex flex-col justify-between items-center">
      
      {/* Added 'print:hidden' so the back header disappears on print */}
      <div className="w-full flex items-center gap-2 px-4 py-4 font-bold text-black print:hidden">
        <button
          type="button"
          onClick={() => router.push("/guard/vehicle-tracking/generate")}
          className="flex cursor-pointer items-center"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="text-[clamp(15px,2vw,19px)]">Generate QR Code</span>
      </div>

      <div className="flex w-full flex-1 items-center justify-center my-auto">
        <div className="flex w-full max-w-[320px] flex-col items-center rounded-[16px] bg-[#FDFBF0] print:bg-white p-[clamp(24px,5vw,32px)] shadow-lg print:shadow-none">
          <p className="text-2xl font-bold leading-none">
            <span className="text-[#F5A623]">Par</span>
            <span className="text-[#D2691E]">Comm</span>
          </p>
          <p className="mt-1 mb-6 text-[10px] font-medium text-gray-800">Look for place. Occupy space.</p>
          
          <QRCodeSVG value={ticketId} size={160} />
          
          <p className="mt-6 text-sm font-bold text-gray-900">{ticketId}</p>
          <p className="mt-1 text-[10px] font-medium text-gray-600">Valid Until: {validUntil}</p>
        </div>
      </div>

      {/* Added 'print:hidden' so the black print button doesn't print out */}
      <button
        type="button"
        onClick={handlePrint}
        className="mx-auto mb-8 flex w-full max-w-[320px] items-center justify-center gap-2 rounded-full bg-[#1A1A1A] py-3.5 text-[clamp(13px,1.5vw,15px)] font-semibold text-white transition-colors hover:bg-black print:hidden"
      >
        <Printer size={18} />
        <span>Print QR</span>
      </button>
    </div>
  );
}

export default function GenerateQRCodeResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-[#F5A623] flex items-center justify-center">
        <p className="font-bold text-black animate-pulse">Loading Ticket...</p>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}