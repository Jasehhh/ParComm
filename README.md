# ParComm

Real-time vehicle monitoring and parking management system for Central Philippine
University. Built for **SE 2123 &mdash; Software Development III**, Group 1.

QR-code ticketing on entry and exit, paired with live occupancy dashboards for
students, guards, and administrators.

## Features

| Feature | Route | Status |
|---|---|---|
| User Dashboard &mdash; live parking availability | `/user` | Implemented |
| Guard Dashboard &mdash; occupancy view, entry point to ticketing | `/guard` | Implemented |
| Admin Dashboard &mdash; activity log, campus totals | `/admin/dashboard` | Partial &mdash; capacity-threshold editing and peak-hour graphs pending |
| QR Code Generator &mdash; plate validation, ticket creation, 12-hour expiry | `/guard/vehicle-tracking/generate` | Implemented |
| QR Code Scanner &mdash; camera scan on park/exit, rejects expired tickets | `/guard/vehicle-tracking/scan` | Implemented |

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) &mdash; frontend and backend, no separate API layer
- TypeScript, React 19, Tailwind CSS 4
- [Firebase](https://firebase.google.com) &mdash; Firestore (data) + Auth (staff login)
- [`qrcode.react`](https://github.com/gcoro/qrcode.react) for QR generation, [`html5-qrcode`](https://github.com/mebjas/html5-qrcode) for camera scanning

## Getting Started

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root with your Firebase project's web config:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root page redirects to
`/login-page`, where you can continue as a student (no login) or sign in as
guard/admin staff.

## Project Structure

```
src/app/
├── layout.tsx                        root layout, fonts, global styles
├── globals.css                       design tokens, primitives, print styles
├── page.tsx                          splash screen, redirects to /login-page
├── user/page.tsx                     student dashboard (public)
└── (auth)/
    ├── login-page/page.tsx           combined student/guard/admin login
    ├── admin/page.tsx                redirect guard for bare /admin
    ├── admin/dashboard/page.tsx      admin dashboard (auth-gated)
    ├── guard/page.tsx                guard dashboard (auth-gated)
    └── guard/vehicle-tracking/
        ├── page.tsx                  hub: pick scanner or generator
        ├── generate/page.tsx         plate entry + validation
        ├── generate/result/page.tsx  printable QR ticket
        └── scan/page.tsx             camera scan, park/exit

components/
├── AppBar.tsx                        page header with back navigation
├── LoadingState.tsx                  branded full-page loader
├── LotCard.tsx                       single lot summary card
├── LotPicker.tsx                     dropdown for choosing a lot
├── OccupancyGauge.tsx                270° occupancy dial
├── StatTile.tsx                      labelled stat block
├── StatusPill.tsx                    Open / Filling / Full chip
└── Wordmark.tsx                      ParComm logo + tagline

lib/
├── firebase.ts                       Firebase app + auth init
├── authResult.ts                     login wrapped in a Result type
├── functional.ts                     pipe, converge, combineValidators
├── plate.ts                          plate normalization + validation pipeline
├── parkingStatus.ts                  pure occupancy/status helpers
├── services/db.ts                    all Firestore reads/writes
└── types/
    ├── schema.ts                     Firestore document shapes
    └── types.d.ts                    shared Result, errors, component props
```

## Team &mdash; Group 1

| Role | Member |
|---|---|
| Project Manager / Team Lead | Florencio, Mark Angelo |
| Lead Developer / Backend | Dalumpines, Justin Jan |
| Frontend Developer | Delos Santos, Nikko |
| UI / UX Designer | Olmo, Niño Kriebel |
| QA / Tester | Estoesta, Bryan Kenth |
| Documentation Lead | Jayme, Johnmarc |
