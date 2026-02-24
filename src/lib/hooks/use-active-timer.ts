"use client";

import { useState, useEffect } from "react";

export interface ActiveTimerData {
  description: string;
  clientName: string;
  startedAt: number;
  billable: boolean;
  rate: number;
}

export function useActiveTimer() {
  const [activeTimer, setActiveTimer] = useState<ActiveTimerData | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    function readTimer() {
      try {
        const stored = localStorage.getItem("af_active_timer");
        setActiveTimer(stored ? JSON.parse(stored) : null);
      } catch { setActiveTimer(null); }
    }
    readTimer();
    window.addEventListener("storage", readTimer);
    window.addEventListener("af-timer-change", readTimer as EventListener);
    return () => {
      window.removeEventListener("storage", readTimer);
      window.removeEventListener("af-timer-change", readTimer as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!activeTimer) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - activeTimer.startedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const elapsedFormatted = [
    Math.floor(elapsed / 3600).toString().padStart(2, "0"),
    Math.floor((elapsed % 3600) / 60).toString().padStart(2, "0"),
    (elapsed % 60).toString().padStart(2, "0"),
  ].join(":");

  return { activeTimer, elapsed, elapsedFormatted };
}
