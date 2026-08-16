// app/generate-qr-code/page.tsx
"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { parsePlate, type PlateError } from "./plate";

export default function GenerateQRCodePage() {
  const router = useRouter();
  const [plateNumber, setPlateNumber] = useState("");
  const [error, setError] = useState<PlateError | null>(null);

  const handleGenerate = () => {
    const result = parsePlate(plateNumber);

    if (result.ok) {
      setError(null);
      const params = new URLSearchParams({ plate: result.value });
      router.push(`/generate-qr-code/result?${params.toString()}`);
    } else {
      setError(result.error); // invalid plate -> no navigation, show why
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm h-[700px] max-h-[85vh] bg-[#FBC02D] rounded-3xl p-5 flex flex-col">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-black font-bold"
        >
          <ArrowLeft size={20} />
          <span>Generate QR Code</span>
        </button>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full bg-[#F5F5DC] rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Vehicle Plate Number
            </label>
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="E.G. ABC 1234"
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-900 mb-1 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {error && (
              <p className="text-xs text-red-600 mb-3">{error.message}</p>
            )}
            <button
              onClick={handleGenerate}
              className={`w-full bg-[#F5F5DC] border border-amber-300 rounded-lg py-2.5 text-sm font-medium text-gray-800 hover:bg-amber-100 transition ${
                error ? "mt-1" : "mt-3"
              }`}
            >
              Generate QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
