// app/generate-qr-code/printer.ts
import type { TicketData } from "./ticket";

// --- Pure: builds printer command bytes from ticket data ---
// (ESC/POS is the common command set for thermal printers)
const ESC = 0x1b;
const GS = 0x1d;

const textEncoder = new TextEncoder();

const initPrinter = (): number[] => [ESC, 0x40]; // ESC @  (reset)
const centerAlign = (): number[] => [ESC, 0x61, 0x01]; // ESC a 1
const feedLines = (n: number): number[] => [ESC, 0x64, n]; // ESC d n
const cutPaper = (): number[] => [GS, 0x56, 0x00]; // GS V 0

const textLine = (text: string): number[] => [
  ...Array.from(textEncoder.encode(text)),
  0x0a, // newline
];

// QR code command block (varies by printer model — this follows a common
// ESC/POS QR extension; confirm against your printer's datasheet)
const qrCodeCommand = (data: string): number[] => {
  const bytes = Array.from(textEncoder.encode(data));
  const len = bytes.length + 3;
  const pL = len % 256;
  const pH = Math.floor(len / 256);

  return [
    // Set QR model
    GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00,
    // Set module size
    GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06,
    // Store data
    GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...bytes,
    // Print QR
    GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30,
  ];
};

// Pure: composes the full print job from ticket data + QR payload
export const buildPrintCommands = (
  ticket: TicketData,
  qrPayload: string
): Uint8Array => {
  const commands = [
    ...initPrinter(),
    ...centerAlign(),
    ...textLine("PARKING TICKET"),
    ...textLine(`Plate: ${ticket.plateNumber}`),
    ...textLine(`Entry: ${new Date(ticket.entryTimestamp).toLocaleString()}`),
    ...feedLines(2),
    ...qrCodeCommand(qrPayload),
    ...feedLines(3),
    ...cutPaper(),
  ];

  return new Uint8Array(commands);
};

// --- Impure: Bluetooth I/O, isolated at the edge ---
// Most thermal printers expose a "Serial Port Profile" service over BLE.
// The UUIDs below are common for cheap ESC/POS BLE printers — replace with
// your printer's actual service/characteristic UUIDs.
const PRINTER_SERVICE_UUID = "000018f0-0000-1000-8000-00805f9b34fb";
const PRINTER_CHARACTERISTIC_UUID = "00002af1-0000-1000-8000-00805f9b34fb";

export type PrinterError =
  | { type: "BLUETOOTH_UNAVAILABLE"; message: string }
  | { type: "CONNECTION_FAILED"; message: string }
  | { type: "WRITE_FAILED"; message: string };

export const printToThermalPrinter = async (
  commands: Uint8Array
): Promise<{ ok: true } | { ok: false; error: PrinterError }> => {
  if (!navigator.bluetooth) {
    return {
      ok: false,
      error: {
        type: "BLUETOOTH_UNAVAILABLE",
        message: "Web Bluetooth is not supported on this device/browser.",
      },
    };
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [PRINTER_SERVICE_UUID] }],
    });

    const server = await device.gatt?.connect();
    const service = await server?.getPrimaryService(PRINTER_SERVICE_UUID);
    const characteristic = await service?.getCharacteristic(
      PRINTER_CHARACTERISTIC_UUID
    );

    if (!characteristic) {
      return {
        ok: false,
        error: {
          type: "CONNECTION_FAILED",
          message: "Could not reach the printer's write characteristic.",
        },
      };
    }

    // BLE writes are often chunked (typically 20 bytes per write)
    const CHUNK_SIZE = 20;
    for (let i = 0; i < commands.length; i += CHUNK_SIZE) {
      const chunk = commands.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: {
        type: "WRITE_FAILED",
        message: e instanceof Error ? e.message : "Unknown printer error.",
      },
    };
  }
};