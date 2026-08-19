export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type PlateError =
  | { type: "EMPTY"; message: string }
  | { type: "TOO_SHORT"; message: string }
  | { type: "INVALID_CHARS"; message: string }
  | { type: "INVALID_FORMAT"; message: string };

