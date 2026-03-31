"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const storedValue = window.localStorage.getItem(key);
    if (!storedValue) {
      return fallback;
    }

    return JSON.parse(storedValue) as T;
  } catch {
    return fallback;
  }
}

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [state, setInternalState] = useState<T>(initialValue);
  const hydratedRef = useRef(false);
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    setInternalState(readStoredValue(key, initialValueRef.current));
    hydratedRef.current = true;
  }, [key]);

  const setState = useCallback(
    (value: T | ((current: T) => T)) => {
      setInternalState((current) => {
        const nextValue =
          typeof value === "function"
            ? (value as (current: T) => T)(current)
            : value;

        if (hydratedRef.current) {
          try {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          } catch {
            // Ignore storage failures and keep the in-memory state usable.
          }
        }

        return nextValue;
      });
    },
    [key],
  );

  const clearState = () => {
    setInternalState(initialValueRef.current);

    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures and keep the in-memory state usable.
    }
  };

  return [state, setState, clearState] as const;
}
