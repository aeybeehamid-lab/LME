"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("lme_token");
  }

  function logout() {
    localStorage.removeItem("lme_token");
    router.push("/login");
  }

  function resetTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, INACTIVITY_MS);
  }

  useEffect(() => {
    if (pathname === "/login") return;

    if (!getToken()) {
      router.push("/login");
      return;
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  return { logout, getToken };
}