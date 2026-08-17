"use client";

import { useState } from "react";
import { ChevronDown, ScanQrCode } from "lucide-react";
import Link from "next/link";
import { getPercentFull, getStatus } from "@/lib/parkingStatus";

type Lot = {
  id: string;
  name: string;
  occupied: number;
  capacity: number;
};

const LOCATIONS: Lot[] = [
  { id: "engineering", name: "Engineering", occupied: 40, capacity: 50 },
  { id: "church", name: "University Church", occupied: 12, capacity: 30 },
  { id: "rmh", name: "RMH", occupied: 8, capacity: 20 },
  { id: "hll3", name: "HLL III", occupied: 15, capacity: 25 },
  { id: "gym", name: "University Gym", occupied: 38, capacity: 40 },
  { id: "weston", name: "Weston Hall", occupied: 5, capacity: 20 },
  { id: "field", name: "Elementary Field", occupied: 2, capacity: 15 },
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

function Gauge({ occupied, capacity }: { occupied: number; capacity: number }) {
  const percentFull = getPercentFull(occupied, capacity);
  const ringColor = getStatus(percentFull).color;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filledLength = (percentFull / 100) * circumference;
  const strokeDashoffset = circumference - filledLength;

  return (
    <div className="relative mx-auto aspect-square w-[clamp(125px,38vw,190px)]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#EFEAE0" strokeWidth="10" />
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
        <span className="text-[clamp(22px,5vw,34px)] font-bold leading-none text-black">{occupied}</span>
        <span className="mt-1 text-[clamp(8px,1.5vw,11px)] text-black">/ {capacity}</span>
      </div>
    </div>
  );
}

function CapacityRow({ name, occupied, capacity }: Building) {
  const percentFull = getPercentFull(occupied, capacity);
  const status = getStatus(percentFull);

  return (
    <div className="rounded-[12px] bg-stone-200 p-[clamp(9px,1.5vw,14px)]">
      <div className="mb-[clamp(4px,0.7vw,7px)] flex items-center justify-between">
        <span className="text-[clamp(10px,1.4vw,14px)] font-medium text-black">{name}</span>
        <span
          className="rounded-full px-[clamp(9px,1vw,12px)] py-[clamp(3px,0.4vw,5px)] text-[clamp(7px,0.9vw,10px)] font-medium text-white"
          style={{ backgroundColor: status.color }}
        >
          {status.label}
        </span>
      </div>
      <div className="h-[clamp(5px,0.6vw,8px)] overflow-hidden rounded-full bg-stone-300">
        <div className="h-full rounded-full" style={{ width: `${percentFull}%`, backgroundColor: status.color }} />
      </div>
      <div className="mt-[clamp(2px,0.4vw,4px)] flex justify-between text-[clamp(7px,0.9vw,10px)] text-black">
        <span>{occupied} / {capacity}</span>
        <span>{percentFull}%</span>
      </div>
    </div>
  );
}

export default function GuardDashboardPage() {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(LOCATIONS[0].id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedLot = LOCATIONS.find((l) => l.id === selectedLocationId)!;
  const availableSpaces = selectedLot.capacity - selectedLot.occupied;

  return (
    <div className="relative min-h-screen w-full bg-[#F6F2D9] p-4 pb-8 font-sans">
      <div className="mb-[clamp(9px,1.5vw,14px)] text-center">
        <span className="text-[clamp(19px,2.5vw,28px)] font-bold leading-none">
          <span className="text-[#F5A623]">Par</span>
          <span className="text-[#D2691E]">Comm</span>
        </span>
      </div>

      <div className="relative mb-[clamp(8px,1.3vw,12px)]">
        <div className="flex h-[clamp(29px,3vw,38px)] w-full items-center justify-between rounded-full bg-[#DCDCDD] pl-[clamp(10px,1.5vw,15px)] pr-1 text-[clamp(9px,1vw,13px)] text-black">
          <span>{selectedLot.name}</span>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex h-[clamp(24px,2.5vw,32px)] w-[clamp(24px,2.5vw,32px)] shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-[#F5A623] p-0"
            aria-label="Toggle location dropdown"
          >
            <ChevronDown
              size={15}
              className={`text-white transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {isDropdownOpen && (
          <div className="absolute left-0 top-[calc(100%+5px)] z-20 w-full rounded-[14px] bg-[#DCDCDD] p-[5px] shadow-lg">
            {LOCATIONS.map((location) => (
              <button
                type="button"
                key={location.id}
                onClick={() => {
                  setSelectedLocationId(location.id);
                  setIsDropdownOpen(false);
                }}
                className={`mb-[1px] h-[clamp(26px,2.8vw,35px)] w-full rounded-full px-[clamp(10px,1.5vw,15px)] text-left text-[clamp(9px,1vw,13px)] last:mb-0 ${
                  location.id === selectedLocationId
                    ? "bg-[#F5A623] font-semibold text-white"
                    : "text-black"
                }`}
              >
                {location.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-[clamp(8px,1.3vw,12px)] rounded-[12px] bg-stone-200 p-[clamp(10px,1.5vw,16px)] text-center">
        <p className="text-[clamp(10px,1.3vw,15px)] font-semibold leading-none text-black">
          Campus Parking Status
        </p>
        <p className="mt-[2px] mb-[2px] text-[clamp(7px,0.9vw,10px)] text-black">
          Live Availability Monitor
        </p>

        <Gauge occupied={selectedLot.occupied} capacity={selectedLot.capacity} />

        <div className="mt-[clamp(2px,0.6vw,7px)] flex justify-between px-[clamp(1px,0.5vw,5px)]">
          <div>
            <p className="text-[clamp(7px,0.8vw,10px)] text-black">Available Spaces</p>
            <p className="text-[clamp(10px,1.1vw,14px)] font-semibold text-black">{availableSpaces}</p>
          </div>
          <div>
            <p className="text-[clamp(7px,0.8vw,10px)] text-black">Total Capacity</p>
            <p className="text-[clamp(10px,1.1vw,14px)] font-semibold text-black">{selectedLot.capacity}</p>
          </div>
        </div>
      </div>

      <div className="space-y-[clamp(6px,1vw,10px)]">
        {BUILDINGS.map((building) => (
          <CapacityRow key={building.name} {...building} />
        ))}
      </div>

      <Link
        href="/auth/guard/vehicle-tracking"
        className="fixed bottom-2 left-1/2 z-50 -translate-x-1/2 rounded-full border-4 border-[#F5A623] bg-[#F6F2D9] p-[clamp(10px,1.8vw,14px)] shadow-lg"
      >
        <ScanQrCode size={22} className="text-black" strokeWidth={2} />
      </Link>
    </div>
  );
}
