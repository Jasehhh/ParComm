// app/generate-qr-code/page.tsx
"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { parsePlate, type PlateError } from "./plate";

export default function GenerateQRCodePage() {
  const router = useRouter();
  const [plateNumber, setPlateNumber] = useState("");
  const [generatedValue, setGeneratedValue] = useState<string | null>(null);
  const [error, setError] = useState<PlateError | null>(null);

  const handleGenerate = () => {
    const result = parsePlate(plateNumber);

    if (result.ok) {
      setGeneratedValue(result.value); // only valid, normalized plates get here
      setError(null);
    } else {
      setGeneratedValue(null);
      setError(result.error); // invalid plate -> no QR code, show why
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center px-4 pt-6">
      <h1 className="text-white text-xl font-semibold mb-4 self-start">
        Generate QR Code
      </h1>

      <div className="w-full max-w-sm bg-amber-400 rounded-3xl p-5 flex-1">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-black font-medium mb-6"
        >
          <ArrowLeft size={20} />
          <span>Generate QR Code</span>
        </button>

        <div className="bg-amber-50 rounded-2xl p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Vehicle Plate Number
          </label>
          <input
            type="text"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="E.G. ABC 1234"
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm mb-1 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {error && (
            <p className="text-xs text-red-600 mb-3">{error.message}</p>
          )}
          <button
            onClick={handleGenerate}
            className={`w-full bg-amber-50 border border-amber-300 rounded-lg py-2.5 text-sm font-medium text-gray-800 hover:bg-amber-100 transition ${
              error ? "mt-1" : "mt-3"
            }`}
          >
            Generate QR Code
          </button>
        </div>

        {generatedValue && (
          <div className="bg-amber-50 rounded-2xl p-5 shadow-sm mt-4 flex flex-col items-center">
            <QRCodeSVG value={generatedValue} size={180} />
            <p className="mt-3 text-sm text-gray-700">{generatedValue}</p>
          </div>
        )}
      </div>
    </div>
  );
}