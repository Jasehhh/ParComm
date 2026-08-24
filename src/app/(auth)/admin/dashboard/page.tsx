"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getPercentFull, getStatus } from "@/lib/parkingStatus";
import { subscribeToParkingAreas, subscribeToActivityLogs } from "@/lib/services/db";
import type { ActivityLogRecord, ParkingArea } from "@/lib/types/schema";

function Gauge({ occupied, capacity }: { occupied: number; capacity: number }) {
  const percentFull = getPercentFull(occupied, capacity);
  const ringColor = getStatus(percentFull).color;
  const radius = 54
  const circumference = 2 * Math.PI * radius;
  const filledLength = (percentFull / 100) * circumference;
  const strokeDashoffset = circumference - filledLength;

  return (
    <div className="relative mx-auto aspect-square w-[clamp(110px,20vw,150px)]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#E5DFC8" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-[stroke-dashoffset] duration-600 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[clamp(20px,3vw,28px)] font-bold leading-none text-black">{occupied}</span>
        <span className="mt-1 text-[clamp(8px,1.1vw,10px)] text-black">/ {capacity}</span>
      </div>
    </div>
  );
}

function CapacityRow({ name, occupied, capacity }: ParkingArea) {
  const percentFull = getPercentFull(occupied, capacity);
  const status = getStatus(percentFull);

  return (
    <div className="rounded-[10px] bg-white p-[clamp(8px,1vw,12px)]">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[clamp(9px,1.1vw,12px)] font-medium text-black">{name}</span>
        <span className="rounded-full bg-current px-2 py-0.5 text-[clamp(6px,0.7vw,8px)] font-medium text-white" style={{ backgroundColor: status.color }}>
          {status.label}
        </span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-stone-200">
        <div className="h-full rounded-full" style={{ width: `${percentFull}%`, backgroundColor: status.color }} />
      </div>
      <div className="mt-1 flex justify-between text-[clamp(6px,0.7vw,8px)] text-black">
        <span>{occupied} / {capacity}</span>
        <span>{percentFull}%</span>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Real-time Database State
  const [activities, setActivities] = useState<ActivityLogRecord[]>([]);
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    // 1. Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      const email = firebaseUser?.email?.toLowerCase();

      if (!firebaseUser || email !== "admin@cpu.edu.ph") {
        router.push("/login-page");
      } else {
        setUser(firebaseUser);
      }
      setCheckingAuth(false);
    });

    // 2. Parking Areas Listener (For the bars and total gauge)
    const unsubscribeParking = subscribeToParkingAreas((liveData) => {
      setParkingAreas(liveData);
    });

    // 3. Activity Log Listener (For the main table)
    const unsubscribeLogs = subscribeToActivityLogs((liveLogs) => {
      setActivities(liveLogs);
    });

    // Cleanup all 3 listeners when admin logs out or closes page
    return () => {
      unsubscribeAuth();
      unsubscribeParking();
      unsubscribeLogs();
    };
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/login-page");
  }

  // Dynamically calculate the campus totals based on real-time data
  const campusTotal = parkingAreas.reduce(
    (acc, area) => {
      acc.occupied += area.occupied;
      acc.capacity += area.capacity;
      return acc;
    },
    { occupied: 0, capacity: 0 }
  );

  if (checkingAuth || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F6F2D9]">
        <div className="text-[#D2691E] text-xl font-bold animate-pulse">Verifying Admin...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F6F2D9] p-4 font-sans sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[clamp(15px,1.8vw,20px)] font-medium text-black">
          Welcome to <span className="font-bold text-[#F5A623]">Par</span>
          <span className="font-bold text-[#D2691E]">Comm</span>
        </h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-[clamp(11px,1.2vw,13px)] font-semibold text-red-600"
        >
          Logout
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-[14px] bg-[#F5A623]">
          <p className="p-3 text-[clamp(13px,1.5vw,16px)] font-bold text-black">Activity Log</p>

          <div className="overflow-x-auto">
            <table className="w-full text-[clamp(10px,1.1vw,12px)]">
              <thead>
                <tr className="text-left text-black/70">
                  <th className="px-3 pb-2 font-medium">QR ID</th>
                  <th className="px-3 pb-2 font-medium">Plate Number</th>
                  <th className="px-3 pb-2 font-medium">Time Stamp</th>
                  <th className="px-3 pb-2 font-medium">Status</th>
                  <th className="px-3 pb-2 font-medium">Location</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-black/70">
                      No activity logs found.
                    </td>
                  </tr>
                ) : (
                  activities.map((row, i) => (
                    // FIX: Unique key combining ID and index prevents React duplication crashes
                    <tr key={`${row.qrId}-${i}`} className={i % 2 === 0 ? "bg-[#FBBF4D]" : "bg-transparent"}>
                      <td className="px-3 py-1.5 text-black font-mono">{row.qrId}</td>
                      <td className="px-3 py-1.5 text-black uppercase">{row.plate_number}</td>
                      <td className="px-3 py-1.5 text-black font-mono">{row.time_stamp}</td>
                      <td className="px-3 py-1.5 text-black">{row.status}</td>
                      <td className="px-3 py-1.5 text-black capitalize">{row.location}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-[14px] bg-stone-200 p-[clamp(12px,1.5vw,16px)] text-center">
            <p className="text-[clamp(11px,1.2vw,14px)] font-semibold leading-none text-black">
              Campus Parking Status
            </p>
            <p className="mt-1 mb-1 text-[clamp(7px,0.9vw,9px)] text-black">
              Live Availability Monitor
            </p>

            <Gauge occupied={campusTotal.occupied} capacity={campusTotal.capacity} />

            <div className="mt-2 flex justify-between px-1">
              <div>
                <p className="text-[clamp(7px,0.8vw,9px)] text-black">Available Spaces</p>
                <p className="text-[clamp(10px,1.1vw,13px)] font-semibold text-black">
                  {campusTotal.capacity > 0 ? campusTotal.capacity - campusTotal.occupied : 0}
                </p>
              </div>
              <div>
                <p className="text-[clamp(7px,0.8vw,9px)] text-black">Total Capacity</p>
                <p className="text-[clamp(10px,1.1vw,13px)] font-semibold text-black">
                  {campusTotal.capacity}
                </p>
              </div>
            </div>
          </div>

          {parkingAreas.map((b) => (
            <CapacityRow key={b.id} {...b} />
          ))}
        </div>
      </div>
    </div>
  );
}