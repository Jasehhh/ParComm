"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getStatus, getPercentFull } from "@/lib/parkingStatus";

type ActivityRow = {
  id: string;
  plate: string;
  time: string;
  status: "Parked" | "Exited";
  location: string;
};

// temporary: hardcoded data (need firebase realtime db)
const ACTIVITY_LOG: ActivityRow[] = [
  { id: "001", plate: "ABC 1234", time: "00:00:00", status: "Parked", location: "Engi. Bldg." },
  { id: "002", plate: "ABC 1234", time: "00:00:00", status: "Exited", location: "" },
  { id: "003", plate: "ABC 1234", time: "00:00:00", status: "Parked", location: "Engi. Bldg." },
  { id: "004", plate: "ABC 1234", time: "00:00:00", status: "Exited", location: "" },
  { id: "005", plate: "ABC 1234", time: "00:00:00", status: "Parked", location: "Engi. Bldg." },
  { id: "006", plate: "ABC 1234", time: "00:00:00", status: "Exited", location: "" },
  { id: "007", plate: "ABC 1234", time: "00:00:00", status: "Parked", location: "Engi. Bldg." },
  { id: "008", plate: "ABC 1234", time: "00:00:00", status: "Exited", location: "" },
  { id: "009", plate: "ABC 1234", time: "00:00:00", status: "Parked", location: "Engi. Bldg." },
  { id: "010", plate: "ABC 1234", time: "00:00:00", status: "Exited", location: "" },
];

type Building = {
  name: string;
  occupied: number;
  capacity: number;
};

const BUILDINGS: Building[] = [
  { name: "Engineering Building", occupied: 10, capacity: 10 },
  { name: "University Gym", occupied: 30, capacity: 40 },
];

const CAMPUS_TOTAL = { occupied: 40, capacity: 50 };

function Gauge({ occupied, capacity }: { occupied: number; capacity: number }) {
  const percentFull = getPercentFull(occupied, capacity);
  const ringColor = getStatus(percentFull).color;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filledLength = (percentFull / 100) * circumference;
  const strokeDashoffset = circumference - filledLength;

  return (
    <div className="relative w-[clamp(110px,20vw,150px)] aspect-square mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
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
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[clamp(20px,3vw,28px)] leading-none font-bold text-black">{occupied}</span>
        <span className="text-[clamp(8px,1.1vw,10px)] text-black mt-1">/ {capacity}</span>
      </div>
    </div>
  );
}

function CapacityRow({ name, occupied, capacity }: Building) {
  const percentFull = getPercentFull(occupied, capacity);
  const status = getStatus(percentFull);

  return (
    <div className="rounded-[10px] bg-white p-[clamp(8px,1vw,12px)]">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[clamp(9px,1.1vw,12px)] font-medium text-black">{name}</span>
        <span
          className="text-[clamp(6px,0.7vw,8px)] font-medium px-2 py-0.5 rounded-full bg-white"
        >
          {status.label}
        </span>
      </div>
      <div className="h-1.25 rounded-full bg-stone-200 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${percentFull}%`, backgroundColor: status.color }}
        />
      </div>
      <div className="flex justify-between text-[clamp(6px,0.7vw,8px)] text-black mt-1">
        <span>{occupied} / {capacity}</span>
        <span>{percentFull}%</span>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/admin/login");
      } else {
        setUser(firebaseUser);
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/admin/login");
  }

  if (checkingAuth || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-page">
        <p className="text-black text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-page p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[clamp(15px,1.8vw,20px)] font-medium text-black">
          Welcome to{" "}
          <span className="font-bold">
            <span className="text-brand">Par</span>
            <span className="text-brand-deep">Comm</span>
          </span>
        </h1>
        <button
          onClick={handleLogout}
          className="text-[clamp(11px,1.2vw,13px)] font-semibold text-red-600"
        >
          Logout
        </button>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-[14px] overflow-hidden bg-brand">
          <p className="font-bold text-[clamp(13px,1.5vw,16px)] text-black p-3">Activity Log</p>

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
                {ACTIVITY_LOG.map((row, i) => (
                  <tr
                    key={row.id}
                    className={i % 2 === 0 ? "bg-[#FBBF4D]" : "bg-transparent"}
                  >
                    <td className="px-3 py-1.5 text-black">{row.id}</td>
                    <td className="px-3 py-1.5 text-black">{row.plate}</td>
                    <td className="px-3 py-1.5 text-black">{row.time}</td>
                    <td className="px-3 py-1.5 text-black">{row.status}</td>
                    <td className="px-3 py-1.5 text-black">{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-[14px] p-[clamp(12px,1.5vw,16px)] text-center bg-stone-200">
            <p className="font-semibold text-[clamp(11px,1.2vw,14px)] text-black leading-none">
              Campus Parking Status
            </p>
            <p className="text-[clamp(7px,0.9vw,9px)] text-black mt-1 mb-1">
              Live Availability Monitor
            </p>

            <Gauge occupied={CAMPUS_TOTAL.occupied} capacity={CAMPUS_TOTAL.capacity} />

            <div className="flex justify-between mt-2 px-1">
              <div>
                <p className="text-[clamp(7px,0.8vw,9px)] text-black">Available Spaces</p>
                <p className="text-[clamp(10px,1.1vw,13px)] font-semibold text-black">
                  {CAMPUS_TOTAL.capacity - CAMPUS_TOTAL.occupied}
                </p>
              </div>
              <div>
                <p className="text-[clamp(7px,0.8vw,9px)] text-black">Total Capacity</p>
                <p className="text-[clamp(10px,1.1vw,13px)] font-semibold text-black">
                  {CAMPUS_TOTAL.capacity}
                </p>
              </div>
            </div>
          </div>

          {BUILDINGS.map((b) => (
            <CapacityRow key={b.name} {...b} />
          ))}
        </div>
      </div>
    </div>
  );
}