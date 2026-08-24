"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { parsePlate } from "@/lib/plate";
import { PlateError } from "@/lib/types/types";
import { createParkingTicket } from "@/lib/services/db";

export default function GenerateQRCodePage() {
  const router = useRouter();
  const [plateNumber, setPlateNumber] = useState("");
  const [error, setError] = useState<PlateError | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePlateChange = (value: string) => {
    const normalized = value.toUpperCase();
    const letters = (normalized.match(/[A-Z]/g) ?? []).slice(0, 3).join("");
    const numbers = (normalized.match(/[0-9]/g) ?? []).slice(0, 4).join("");
    const formatted = letters.length === 3 ? `${letters}-${numbers}` : letters;

    setPlateNumber(formatted);
  };

  const handlePlateKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && plateNumber.endsWith("-")) {
      event.preventDefault();
      setPlateNumber(plateNumber.slice(0, -1));
    }
  };

  const handleGenerate = async () => {
    const result = parsePlate(plateNumber);

    if (result.ok) {
      setError(null);
      setIsGenerating(true);

      try {
        // 1. Generate the unique Ticket ID here
        const newTicketId = `GUEST-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;

        // 2. Save it to Firestore
        await createParkingTicket(newTicketId, result.value);

        // 3. Route to result page with BOTH plate and ticket ID in the URL
        const params = new URLSearchParams({ 
          plate: result.value,
          ticketId: newTicketId 
        });
        
        router.push(`/guard/vehicle-tracking/generate/result?${params.toString()}`);
      } catch (err) {
        console.error("Failed to generate ticket:", err);
        setError({ message: "Failed to connect to database." } as PlateError);
      } finally {
        setIsGenerating(false);
      }
    } else {
      setError(result.error);
    } 
  };

  return (
    // Updated background color to #F5A623 to match your yellow mockup!
    <div className="min-h-screen w-full bg-[#F5A623] p-4 font-sans flex flex-col gap-[clamp(14px,2.5vw,20px)]">
      <div className="-mx-4 -mt-4 flex items-center gap-2 px-4 py-4 font-bold text-black">
        <button
          type="button"
          onClick={() => router.push("/guard/vehicle-tracking")}
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
            onChange={(e) => handlePlateChange(e.target.value)}
            onKeyDown={handlePlateKeyDown}
            maxLength={8}
            pattern="[A-Za-z]{3}-[0-9]{4}"
            disabled={isGenerating}
            placeholder="E.G. ABC-1234"
            className="mb-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-[clamp(11px,1.3vw,13px)] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
          />
          {error && <p className="mb-3 text-xs text-red-600">{error.message}</p>}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full rounded-lg bg-[#F5A623] py-2.5 text-[clamp(12px,1.4vw,14px)] font-semibold text-white transition disabled:opacity-70 ${error ? "mt-1" : "mt-3"}`}
          >
            {isGenerating ? "Generating..." : "Generate QR Code"}
          </button>
        </div>
      </div>
    </div>
  );
}