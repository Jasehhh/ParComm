"use client";

import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { LoadingState } from "@/components/LoadingState";

// Blocks guard-only screens until Firebase has confirmed the guard session.
export function RequireGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user?.email?.toLowerCase() === "guard@cpu.edu.ph") {
        setAuthorized(true);
        return;
      }

      router.replace("/login-page");
    });
  }, [router]);

  if (!authorized) {
    return <LoadingState message="Verifying guard access" />;
  }

  return <>{children}</>;
}
