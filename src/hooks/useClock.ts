"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useClock(seconds: number, autoStartKey: string | number, enabled: boolean) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const [expired, setExpired] = useState(false);
  const endAt = useRef<number | null>(null);

  const reset = useCallback(() => {
    setRemaining(seconds);
    setExpired(false);
    if (running) {
      endAt.current = Date.now() + seconds * 1000;
    } else {
      endAt.current = null;
    }
  }, [seconds, running]);

  const start = useCallback(() => {
    endAt.current = Date.now() + remaining * 1000;
    setRunning(true);
    setExpired(false);
  }, [remaining]);

  const pause = useCallback(() => {
    setRunning(false);
    endAt.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (running) pause();
    else start();
  }, [running, pause, start]);

  useEffect(() => {
    setRemaining(seconds);
    setExpired(false);
    setRunning(false);
    endAt.current = null;
  }, [autoStartKey, seconds]);

  useEffect(() => {
    if (!enabled) {
      setRunning(false);
      return;
    }
    if (autoStartKey !== 0) {
      setRemaining(seconds);
      setExpired(false);
      endAt.current = Date.now() + seconds * 1000;
      setRunning(true);
    }
  }, [autoStartKey, enabled, seconds]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (!endAt.current) return;
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        setExpired(true);
        endAt.current = null;
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [running]);

  return { remaining, running, expired, start, pause, toggle, reset, setRunning };
}
