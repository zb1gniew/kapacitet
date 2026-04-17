"use client";

import { useCallback } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import {
  createStoredDraft,
  normalizeStoredDraft,
} from "@/lib/workflows/payloads";
import type { StoredDraft } from "@/types/workflows";

type WorkflowDraft = Record<string, unknown>;

export function useStoredWorkflowDraft<TDraft extends WorkflowDraft>(
  key: string,
  initialValue: TDraft,
) {
  const [storedDraft, setStoredDraft] = useLocalStorageState<
    StoredDraft<TDraft>
  >(key, createStoredDraft(initialValue));

  const normalizedDraft = normalizeStoredDraft(storedDraft, initialValue);
  const draft = normalizedDraft.data;

  const setField = useCallback(
    <TKey extends keyof TDraft>(field: TKey, value: TDraft[TKey]) => {
      setStoredDraft((current) => ({
        ...normalizeStoredDraft(current, initialValue),
        _updatedAt: new Date().toISOString(),
        data: {
          ...normalizeStoredDraft(current, initialValue).data,
          [field]: value,
        },
      }));
    },
    [initialValue, setStoredDraft],
  );

  const toggleListValue = useCallback(
    <TKey extends keyof TDraft, TValue extends string | number>(
      field: TKey,
      value: TValue,
    ) => {
      setStoredDraft((current) => {
        const normalized = normalizeStoredDraft(current, initialValue);
        const currentValue = normalized.data[field];
        const entries = Array.isArray(currentValue)
          ? (currentValue as TValue[])
          : [];

        return {
          ...normalized,
          _updatedAt: new Date().toISOString(),
          data: {
            ...normalized.data,
            [field]: entries.includes(value)
              ? entries.filter((entry) => entry !== value)
              : [...entries, value],
          },
        };
      });
    },
    [initialValue, setStoredDraft],
  );

  const setDraft = useCallback(
    (updater: TDraft | ((current: TDraft) => TDraft)) => {
      setStoredDraft((current) => {
        const normalized = normalizeStoredDraft(current, initialValue);
        const nextDraft =
          typeof updater === "function"
            ? (updater as (value: TDraft) => TDraft)(normalized.data)
            : updater;

        return {
          ...normalized,
          _updatedAt: new Date().toISOString(),
          data: nextDraft,
        };
      });
    },
    [initialValue, setStoredDraft],
  );

  const clearDraft = useCallback(() => {
    setStoredDraft(createStoredDraft(initialValue));
  }, [initialValue, setStoredDraft]);

  return {
    draft,
    clientKey: normalizedDraft._clientKey,
    setDraft,
    setField,
    toggleListValue,
    clearDraft,
  };
}
