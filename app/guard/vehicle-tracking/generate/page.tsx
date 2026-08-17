"use client";

import { useState, ChangeEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { parsePlate, formatPlateInput, type PlateError } from "./plate";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function GenerateQRCodePage() {
  const router = useRouter();
  const [plateNumber, setPlateNumber] = useState("");
  const [error, setError] = useState<PlateError | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPlateInput(e.target.value);
    setPlateNumber(formatted);

    if (error) setError(null);
  };

  const handleGenerate = () => {
    const result = parsePlate(plateNumber);

    if (result.ok) {
      setError(null);
      const params = new URLSearchParams({ plate: result.value });
      router.push(`/guard/vehicle-tracking/generate/result?${params.toString()}`);
    } else {
      setError(result.error);
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
          onClick={() => router.back()}
          className="flex cursor-pointer items-center"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="text-[clamp(15px,2vw,19px)]">Generate QR Code</span>
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-full max-w-105 bg-[#FDFBF0] rounded-2xl p-[clamp(20px,4vw,28px)] shadow-sm">
          <label className="block text-[clamp(11px,1.3vw,13px)] font-bold text-gray-800 mb-2">
            Vehicle Plate Number
          </label>
          <input
            type="text"
            value={plateNumber}
            onChange={handleInputChange}
            placeholder="E.G. ABC-1234"
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-[clamp(11px,1.3vw,13px)] text-gray-900 mb-1 font-mono tracking-wider uppercase placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {error && (
            <p className="text-xs text-red-600 mb-3">{error.message}</p>
          )}
          <button
            onClick={handleGenerate}
            className={`w-full rounded-lg py-2.5 text-[clamp(12px,1.4vw,14px)] font-semibold text-white transition ${
              error ? "mt-1" : "mt-3"
            }`}
            style={{ backgroundColor: "#F5A623" }}
          >
            Generate QR Code
          </button>
        </div>
      </div>
    </div>
  );
}