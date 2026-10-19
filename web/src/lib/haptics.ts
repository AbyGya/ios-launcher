import { useSettings } from "../store/settings";

export function haptic(pattern: number | number[] = 10) {
  if (!useSettings.getState().haptics) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    void 0;
  }
}

export const Haptics = {
  light: () => haptic(8),
  medium: () => haptic(14),
  heavy: () => haptic(22),
  success: () => haptic([10, 40, 18]),
  warning: () => haptic([16, 60, 16]),
  error: () => haptic([24, 50, 24, 50, 24]),
  selection: () => haptic(6),
};
