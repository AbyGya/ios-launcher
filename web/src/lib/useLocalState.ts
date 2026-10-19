import { useEffect, useState } from "react";

export function useLocalState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`ip17-${key}`);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      void 0;
    }
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(`ip17-${key}`, JSON.stringify(value));
    } catch {
      void 0;
    }
  }, [key, value]);

  return [value, setValue];
}
