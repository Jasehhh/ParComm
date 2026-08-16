// lib/authResult.ts
import { signInWithEmailAndPassword, type UserCredential } from "firebase/auth";
import { auth } from "./firebase";

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type AuthError = { type: "INVALID_CREDENTIALS"; message: string };

export const attemptLogin = async (
  email: string,
  password: string
): Promise<Result<UserCredential, AuthError>> => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return { ok: true, value: credential };
  } catch {
    return {
      ok: false,
      error: { type: "INVALID_CREDENTIALS", message: "Invalid email or password" },
    };
  }
};