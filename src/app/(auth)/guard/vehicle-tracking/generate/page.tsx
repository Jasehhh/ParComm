"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { parsePlate} from "@/lib/plate";
import { PlateError } from "@/lib/types/types";

export default function GenerateQRCodePage() {
  const router = useRouter();
  const [plateNumber, setPlateNumber] = useState("");
  const [error, setError] = useState<PlateError | null>(null);

  const handleGenerate = () => {
    const result = parsePlate(plateNumber);

    if (result.ok) {
      setError(null);
      const params = new URLSearchParams({ plate: result.value });
      router.push(`/auth/guard/vehicle-tracking/generate/result?${params.toString()}`);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F2D9] p-4 font-sans flex flex-col gap-[clamp(14px,2.5vw,20px)]">
      <div className="-mx-4 -mt-4 flex items-center gap-2 bg-[#F5A623] px-4 py-4 font-bold text-black">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex cursor-pointer items-center"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="text-[clamp(15px,2vw,19px)]">Generate QR Code</span>
      </div>

      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-[420px] rounded-[16px] bg-[#FDFBF0] p-[clamp(20px,4vw,28px)] shadow-sm">
          <label className="mb-2 block text-[clamp(11px,1.3vw,13px)] font-bold text-gray-800">
            Vehicle Plate Number
          </label>
          <input
            type="text"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="E.G. ABC 1234"
            className="mb-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-[clamp(11px,1.3vw,13px)] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {error && <p className="mb-3 text-xs text-red-600">{error.message}</p>}
          <button
            type="button"
            onClick={handleGenerate}
            className={`w-full rounded-lg bg-[#F5A623] py-2.5 text-[clamp(12px,1.4vw,14px)] font-semibold text-white transition ${error ? "mt-1" : "mt-3"}`}
          >
            Generate QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
