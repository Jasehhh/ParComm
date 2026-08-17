"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Lot = {
  id: string;
  name: string;
  occupied: number;
  capacity: number;
};

// temporary: hardcoded data (need firebase)
const LOCATIONS: Lot[] = [
  { id: "engineering", name: "Engineering", occupied: 33, capacity: 50 },
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
  { name: "Engineering Building", occupied: 3, capacity: 10 },
  { name: "University Gym", occupied: 30, capacity: 40 },
];

function getStatus(percent: number) {
  if (percent < 60)
    return {
      label: "Available",
      color: "#2CC83A",
      bg: "#2CC83A",
    };

  if (percent < 85)
    return {
      label: "Limited",
      color: "#FF8A00",
      bg: "#FF8A00",
    };

  return {
    label: "Full",
    color: "#E53935",
    bg: "#E53935",
  };
}

function Gauge({ occupied, capacity }: { occupied: number; capacity: number }) {
  const percentFull = Math.round((occupied / capacity) * 100);
  const ringColor = getStatus(percentFull).color;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filledLength = (percentFull / 100) * circumference;
  const strokeDashoffset = circumference - filledLength;

  return (
    <div className="relative w-[clamp(125px,38vw,190px)] aspect-square mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#EFEAE0"
          strokeWidth="10"
        />

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
        <span className="text-[clamp(22px,5vw,34px)] leading-none font-bold text-black">
          {occupied}
        </span>

        <span className="text-[clamp(8px,1.5vw,11px)] text-black mt-1">
          / {capacity}
        </span>
      </div>
    </div>
  );
}

function CapacityRow({ name, occupied, capacity }: Building) {
  const percentFull = Math.round((occupied / capacity) * 100);
  const status = getStatus(percentFull);

  return (
    <div className="rounded-[12px] bg-stone-200 p-[clamp(9px,1.5vw,14px)]">
      <div className="flex justify-between items-center mb-[clamp(4px,0.7vw,7px)]">
        <span className="text-[clamp(10px,1.4vw,14px)] font-medium text-black">
          {name}
        </span>

        <span
          className="text-[clamp(7px,0.9vw,10px)] font-medium px-[clamp(9px,1vw,12px)] py-[clamp(3px,0.4vw,5px)] rounded-full"
          style={{
            color: "#FFFFFF",
            backgroundColor: status.bg,
          }}
        >
          {status.label}
        </span>
      </div>

      <div className="h-[clamp(5px,0.6vw,8px)] rounded-full bg-stone-300 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentFull}%`,
            backgroundColor: status.color,
          }}
        />
      </div>

      <div className="flex justify-between text-[clamp(7px,0.9vw,10px)] text-black mt-[clamp(2px,0.4vw,4px)]">
        <span>
          {occupied} / {capacity}
        </span>

        <span>{percentFull}%</span>
      </div>
    </div>
  );
}

export default function UserDashboardPage() {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    LOCATIONS[0].id
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedLot =
    LOCATIONS.find((location) => location.id === selectedLocationId)!;

  const availableSpaces = selectedLot.capacity - selectedLot.occupied;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-stone-900 p-4 sm:p-6 md:p-8">
      <div className="relative w-full max-w-[390px] rounded-[18px] bg-page p-[clamp(10px,2vw,18px)]">
        {/* Header */}
        <div className="text-center mb-[clamp(9px,1.5vw,14px)]">
          <span className="font-bold text-[clamp(19px,2.5vw,28px)] leading-none">
            <span className="text-brand">Par</span>
            <span className="text-brand-deep">Comm</span>
          </span>
        </div>

        {/* Location select */}
        <div className="relative mb-[clamp(8px,1.3vw,12px)]">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full h-[clamp(29px,3vw,38px)] flex items-center justify-between rounded-full pl-[clamp(10px,1.5vw,15px)] pr-1 text-[clamp(9px,1vw,13px)] text-black"
            style={{ backgroundColor: "#DCDCDD" }}
          >
            <span>{selectedLot.name}</span>

            <span
              className="w-[clamp(24px,2.5vw,32px)] h-[clamp(24px,2.5vw,32px)] rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#F5A623" }}
            >
              <ChevronDown
                size={15}
                className={`text-white transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </span>
          </button>

          {isDropdownOpen && (
            <div
              className="absolute z-20 top-[calc(100%+5px)] left-0 w-full rounded-[14px] p-[5px] shadow-lg"
              style={{ backgroundColor: "#DCDCDD" }}
            >
              {LOCATIONS.map((location) => (
                <button
                  type="button"
                  key={location.id}
                  onClick={() => {
                    setSelectedLocationId(location.id);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full h-[clamp(26px,2.8vw,35px)] text-left text-[clamp(9px,1vw,13px)] px-[clamp(10px,1.5vw,15px)] rounded-full mb-[1px] last:mb-0"
                  style={
                    location.id === selectedLocationId
                      ? {
                          backgroundColor: "#F5A623",
                          color: "#FFFFFF",
                          fontWeight: 600,
                        }
                      : {
                          color: "#000000",
                        }
                  }
                >
                  {location.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status card */}
        <div className="rounded-[12px] p-[clamp(10px,1.5vw,16px)] mb-[clamp(8px,1.3vw,12px)] text-center bg-stone-200">
          <p className="text-[clamp(10px,1.3vw,15px)] font-semibold text-black leading-none">
            Campus Parking Status
          </p>

          <p className="text-[clamp(7px,0.9vw,10px)] text-black mt-[2px] mb-[2px]">
            Live Availability Monitor
          </p>

          <Gauge
            occupied={selectedLot.occupied}
            capacity={selectedLot.capacity}
          />

          <div className="flex justify-between mt-[clamp(2px,0.6vw,7px)] px-[clamp(1px,0.5vw,5px)]">
            <div>
              <p className="text-[clamp(7px,0.8vw,10px)] text-black">
                Available Spaces
              </p>

              <p className="text-[clamp(10px,1.1vw,14px)] font-semibold text-black">
                {availableSpaces}
              </p>
            </div>

            <div>
              <p className="text-[clamp(7px,0.8vw,10px)] text-black">
                Total Capacity
              </p>

              <p className="text-[clamp(10px,1.1vw,14px)] font-semibold text-black">
                {selectedLot.capacity}
              </p>
            </div>
          </div>
        </div>

        {/* Building breakdown */}
        <div className="space-y-[clamp(6px,1vw,10px)]">
          {BUILDINGS.map((building) => (
            <CapacityRow key={building.name} {...building} />
          ))}
        </div>
      </div>
    </div>
  );
}