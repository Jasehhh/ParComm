"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { processTicketScan, subscribeToParkingAreas } from "@/lib/services/db";
import type { ParkingArea } from "@/lib/types/schema";

export default function ScanQRPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");
  
  // New State Management to handle UI screens smoothly
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [rejectMessage, setRejectMessage] = useState(""); // New rejection state
  
  const router = useRouter();

  // Dynamic Parking Areas State
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);

  // Dropdown States
  const [action, setAction] = useState<"Parked" | "Exited">("Parked");
  const [location, setLocation] = useState<string>(""); 

  const actionRef = useRef(action);
  const locationRef = useRef(location);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // --- Fetch dynamic locations from Firebase ---
  useEffect(() => {
    const unsubscribe = subscribeToParkingAreas((liveData) => {
      setParkingAreas(liveData);
      setLocation(current => {
        if (!current && liveData.length > 0) {
          return liveData[0].id;
        }
        return current;
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let disposed = false;
    let resultHandled = false;
    let scanner: Html5Qrcode | null = null;
    let stopping: Promise<void> | null = null;

    const stopScanner = () => {
      if (stopping) return stopping;
      if (!scanner) return Promise.resolve();

      const state = scanner.getState();
      if (
        state !== Html5QrcodeScannerState.SCANNING &&
        state !== Html5QrcodeScannerState.PAUSED
      ) {
        return Promise.resolve();
      }

      stopping = scanner.stop().finally(() => {
        stopping = null;
      });
      return stopping;
    };

    async function handleScanResult(decodedText: string) {
      setIsProcessing(true);
      setError(""); 
      setRejectMessage("");
      
      try {
        const { plateNumber, newStatus } = await processTicketScan(
          decodedText, 
          locationRef.current, 
          actionRef.current
        );
        
        setIsProcessing(false);
        setSuccessMessage(`Vehicle ${plateNumber} is now ${newStatus}!`);
        
        setTimeout(() => {
           router.push("/guard/vehicle-tracking"); 
        }, 2000);

      } catch (err: any) {
        // If the database blocks the scan (e.g. capacity full), show the big red screen!
        setIsProcessing(false);
        setRejectMessage(err.message || "Failed to process QR code");
      }
    }

    const startFrame = requestAnimationFrame(() => {
      if (disposed) return;

      scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (resultHandled || disposed) return;

            resultHandled = true;
            stopScanner()
              .then(() => handleScanResult(decodedText))
              .catch(() => setError("Unable to stop the camera scanner"));
          },
          () => {}
        )
        .then(() => {
          if (disposed) return stopScanner();
        })
        .catch((err) => {
          if (!disposed) setError("Camera access failed: " + err);
        });
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(startFrame);
      stopScanner().catch(() => {});
      if (scannerRef.current === scanner) scannerRef.current = null;
    };
  }, [router]);

  return (
    <div className="min-h-screen w-full flex flex-col font-sans">
      <div className="bg-[#F5A623] p-4">
        <div className="flex items-center gap-2 font-bold text-black">
          <Link href="/guard/vehicle-tracking" className="flex cursor-pointer items-center" aria-label="Go back">
            <ChevronLeft size={22} />
          </Link>
          <span className="text-lg">Scan QR Code</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-start pt-8 gap-5 bg-black p-6">
        
        {/* State 1: Dropdowns & Scanning Camera */}
        {!isProcessing && !successMessage && !rejectMessage && (
           <>
             <div className="flex w-full max-w-[280px] flex-col gap-4 mb-2">
               <div>
                 <label className="text-[11px] font-bold tracking-widest text-[#F5A623] uppercase">Scanner Action</label>
                 <select
                   value={action}
                   onChange={(e) => setAction(e.target.value as "Parked" | "Exited")}
                   className="mt-1 w-full rounded-lg border-2 border-[#F5A623] bg-[#1A1A1A] p-2.5 text-[14px] font-semibold text-white outline-none focus:ring-2 focus:ring-[#F5A623]"
                 >
                   <option value="Parked">Logging IN (Park Vehicle)</option>
                   <option value="Exited">Logging OUT (Exit Vehicle)</option>
                 </select>
               </div>
               
               <div className={action === "Exited" ? "opacity-50 pointer-events-none" : ""}>
                 <label className="text-[11px] font-bold tracking-widest text-[#F5A623] uppercase">Parking Area</label>
                 <select
                   value={location}
                   onChange={(e) => setLocation(e.target.value)}
                   disabled={action === "Exited"}
                   className="mt-1 w-full rounded-lg border-2 border-[#F5A623] bg-[#1A1A1A] p-2.5 text-[14px] font-semibold text-white outline-none focus:ring-2 focus:ring-[#F5A623]"
                 >
                   {parkingAreas.length === 0 ? (
                     <option value="" disabled>Loading locations...</option>
                   ) : (
                     parkingAreas.map((area) => (
                       <option key={area.id} value={area.id}>
                         {area.name}
                       </option>
                     ))
                   )}
                 </select>
               </div>
             </div>

             <div id="qr-reader" className="aspect-square w-full max-w-[280px] overflow-hidden rounded-[12px] border-2 border-stone-700" />
             {error && <p className="text-sm text-red-400 text-center font-bold">{error}</p>}
             <p className="text-sm text-white/50">Align the QR code inside frame.</p>
           </>
        )}

        {/* State 2: Processing in Database */}
        {isProcessing && (
           <div className="flex flex-1 flex-col items-center justify-center">
             <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#F5A623] border-t-transparent"></div>
             <p className="mt-4 text-white font-bold animate-pulse">Processing Ticket...</p>
           </div>
        )}

        {/* State 3: Success Result */}
        {successMessage && (
           <div className="flex flex-1 flex-col items-center justify-center text-center">
             <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
               </svg>
             </div>
             <p className="text-2xl font-bold text-green-400 mb-2">Success!</p>
             <p className="text-white text-lg font-medium">{successMessage}</p>
             <p className="text-gray-400 text-sm mt-6">Redirecting...</p>
           </div>
        )}

        {/* State 4: THE NEW REJECTION SCREEN */}
        {rejectMessage && (
           <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
             <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
               </svg>
             </div>
             <p className="text-2xl font-bold text-red-400 mb-2">Action Denied</p>
             <p className="text-white text-lg font-medium">{rejectMessage}</p>
             <button
               onClick={() => window.location.reload()} // Cleanly reboots the camera
               className="mt-8 rounded-full bg-[#F5A623] px-8 py-3 font-bold text-black transition-colors hover:bg-amber-400"
             >
               Try Again
             </button>
           </div>
        )}
        
      </div>
    </div>
  );
}