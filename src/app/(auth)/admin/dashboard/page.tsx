"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Inbox, LogOut, Search } from "lucide-react";
import { auth } from "@/lib/firebase";
import { freeSpaces, getPercentFull, getStatus, totalOccupancy } from "@/lib/parkingStatus";
import { combinePredicates, sortBy, unique } from "@/lib/functional";
import { subscribeToParkingAreas, subscribeToActivityLogs } from "@/lib/services/db";
import type { ActivityLogRecord, ParkingArea } from "@/lib/types/schema";
import { LotCard } from "@/components/LotCard";
import { OccupancyGauge } from "@/components/OccupancyGauge";
import { StatTile } from "@/components/StatTile";
import { LoadingState } from "@/components/LoadingState";
import { Wordmark } from "@/components/Wordmark";

type StatusFilter = "All" | ActivityLogRecord["status"];

const STATUS_FILTERS: StatusFilter[] = ["All", "Parked", "Exited", "Not Parked"];

// --- Pure, curried predicates: each closes over one filter value and answers
// one question about a row. combinePredicates() folds them into a single test.
const hasStatus =
  (filter: StatusFilter) =>
  (row: ActivityLogRecord): boolean =>
    filter === "All" || row.status === filter;

const hasLocation =
  (filter: string) =>
  (row: ActivityLogRecord): boolean =>
    filter === "All" || row.location === filter;

const hasDate =
  (day: string) =>
  (row: ActivityLogRecord): boolean =>
    !day || row.date === day;

const matchesTerm =
  (term: string) =>
  (row: ActivityLogRecord): boolean =>
    !term ||
    row.plate_number.toLowerCase().includes(term) ||
    row.qrId.toLowerCase().includes(term);

const STATUS_STYLE: Record<ActivityLogRecord["status"], string> = {
  Parked: "bg-[#e7f4ec] text-[#1f7a3d]",
  Exited: "bg-sand-200 text-ink-700",
  "Not Parked": "bg-brand-100 text-brand-700",
};

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Real-time Database State
  const [activities, setActivities] = useState<ActivityLogRecord[]>([]);
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

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
  const campusTotal = useMemo(() => totalOccupancy(parkingAreas), [parkingAreas]);

  const lotNameById = useMemo(
    () => new Map(parkingAreas.map((area) => [area.id, area.name])),
    [parkingAreas]
  );

  const visibleActivities = useMemo(
    () =>
      activities.filter(
        combinePredicates([
          hasStatus(statusFilter),
          hasLocation(locationFilter),
          hasDate(dateFilter),
          matchesTerm(search.trim().toLowerCase()),
        ])
      ),
    [activities, search, statusFilter, locationFilter, dateFilter]
  );

  const filtersActive =
    statusFilter !== "All" || locationFilter !== "All" || Boolean(dateFilter) || Boolean(search);

  /**
   * Locations that actually appear in the log, so the dropdown keeps working
   * as more buildings are added to Firestore without a code change.
   */
  const locationOptions = useMemo(() => {
    const labelOf = (id: string) => lotNameById.get(id) ?? id;

    // Pure chain: gather -> drop blanks -> de-duplicate -> order. No mutation.
    return sortBy(labelOf)(
      unique([
        ...activities.map((row) => row.location),
        ...parkingAreas.map((area) => area.id),
      ]).filter((id) => id && id !== "-")
    );
  }, [activities, parkingAreas, lotNameById]);

  if (checkingAuth || !user) {
    return <LoadingState message="Verifying admin access" />;
  }

  const percentFull = getPercentFull(campusTotal.occupied, campusTotal.capacity);
  const campusStatus = getStatus(percentFull);
  const availableSpaces = freeSpaces(campusTotal);

  return (
    <div className="bg-sand-50 min-h-screen w-full">
      <header className="border-sand-200 bg-sand-50/85 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Wordmark withMark size="md" />
            <span className="bg-brand-50 text-brand-700 hidden rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="text-ink-500 hover:bg-sand-100 hover:text-ink-900 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-5">
        <div className="mb-5">
          <h1 className="text-ink-900 text-2xl font-extrabold tracking-tight">Campus overview</h1>
          <p className="text-ink-500 mt-1 truncate text-sm">{user.email}</p>
        </div>

        {/* Headline numbers first — this is a monitoring screen */}
        <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatTile
            label="Occupied"
            value={campusTotal.occupied}
            hint={`${percentFull}% of campus`}
          />
          <StatTile
            label="Available"
            value={availableSpaces}
            accent={campusStatus.color}
            hint={campusStatus.label}
          />
          <StatTile label="Capacity" value={campusTotal.capacity} hint="All lots" />
          <StatTile label="Log entries" value={activities.length} hint="Today's feed" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <section className="pc-card overflow-hidden">
            <div className="border-sand-200 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5">
              <div>
                <h2 className="text-ink-900 text-sm font-bold">Activity log</h2>
                <p className="text-ink-400 text-xs">
                  {visibleActivities.length} of {activities.length} entries
                </p>
              </div>

              <div className="relative w-full sm:w-56">
                <Search
                  size={15}
                  className="text-ink-300 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search plate or QR ID"
                  aria-label="Search activity log"
                  className="pc-field py-2 pl-9 text-sm"
                />
              </div>
            </div>

            <div className="border-sand-200 flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5">
              <div className="flex gap-1.5 overflow-x-auto">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    aria-pressed={statusFilter === filter}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      statusFilter === filter
                        ? "bg-ink-900 text-white"
                        : "bg-sand-100 text-ink-500 hover:bg-sand-200"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <span className="bg-sand-200 hidden h-5 w-px sm:block" aria-hidden="true" />

              <label className="sr-only" htmlFor="location-filter">
                Filter by location
              </label>
              <select
                id="location-filter"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="border-sand-300 text-ink-700 focus:border-brand-400 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold outline-none"
              >
                <option value="All">All locations</option>
                {locationOptions.map((id) => (
                  <option key={id} value={id}>
                    {lotNameById.get(id) ?? id}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="date-filter">
                Filter by date
              </label>
              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border-sand-300 text-ink-700 focus:border-brand-400 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold outline-none"
              />

              {filtersActive && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("All");
                    setLocationFilter("All");
                    setDateFilter("");
                    setSearch("");
                  }}
                  className="text-ink-400 hover:text-ink-900 ml-auto text-xs font-semibold transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {visibleActivities.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                <Inbox size={26} className="text-ink-300" />
                <p className="text-ink-700 text-sm font-semibold">
                  {activities.length === 0 ? "No activity yet" : "No matching entries"}
                </p>
                <p className="text-ink-400 max-w-xs text-xs">
                  {activities.length === 0
                    ? "Entries appear here as guards issue tickets and scan vehicles in and out."
                    : "Try a different plate number, QR ID, or status filter."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop: dense table. Mobile: one card per entry. */}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-sand-200 text-ink-500 border-b text-left text-xs">
                        <th className="px-4 py-2.5 font-semibold">QR ID</th>
                        <th className="px-4 py-2.5 font-semibold">Plate</th>
                        <th className="px-4 py-2.5 font-semibold">Time</th>
                        <th className="px-4 py-2.5 font-semibold">Status</th>
                        <th className="px-4 py-2.5 font-semibold">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleActivities.map((row, i) => (
                        // Unique key combining ID and index prevents React duplication crashes
                        <tr
                          key={`${row.qrId}-${i}`}
                          className="border-sand-100 hover:bg-sand-50 border-b transition-colors last:border-b-0"
                        >
                          <td className="text-ink-500 px-4 py-2.5 font-mono text-xs">{row.qrId}</td>
                          <td className="text-ink-900 px-4 py-2.5 font-mono font-semibold uppercase">
                            {row.plate_number}
                          </td>
                          <td className="text-ink-700 px-4 py-2.5 font-mono text-xs">
                            {row.time_stamp}
                            {row.date && (
                              <span className="text-ink-400 ml-2">{row.date}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <LogStatus status={row.status} />
                          </td>
                          <td className="text-ink-700 px-4 py-2.5 capitalize">
                            {lotNameById.get(row.location) ?? row.location}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="divide-sand-100 divide-y md:hidden">
                  {visibleActivities.map((row, i) => (
                    <li key={`${row.qrId}-${i}`} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-ink-900 font-mono text-sm font-bold uppercase">
                          {row.plate_number}
                        </p>
                        <p className="text-ink-400 mt-0.5 truncate text-xs">
                          {row.qrId} · {lotNameById.get(row.location) ?? row.location}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <LogStatus status={row.status} />
                        <p className="text-ink-400 mt-1 font-mono text-[11px]">{row.time_stamp}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <aside className="flex flex-col gap-3 lg:sticky lg:top-20">
            <div className="pc-card p-5">
              <p className="pc-eyebrow">Campus parking</p>
              <p className="text-ink-900 text-sm font-semibold">All lots combined</p>

              <div className="py-4">
                <OccupancyGauge
                  occupied={campusTotal.occupied}
                  capacity={campusTotal.capacity}
                  size={180}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <StatTile label="Available" value={availableSpaces} accent={campusStatus.color} />
                <StatTile label="Capacity" value={campusTotal.capacity} />
              </div>
            </div>

            {parkingAreas.map((area) => (
              <LotCard key={area.id} {...area} />
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}

function LogStatus({ status }: { status: ActivityLogRecord["status"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${STATUS_STYLE[status]}`}
    >
      {status}
    </span>
  );
}
