import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { isLocalAppMode } from '../lib/localApp';

/** Fallback when the live profiles count cannot be loaded. */
export const PUBLIC_USER_COUNT_FALLBACK = 250;

/**
 * Live signed-up user count from `profiles` (exact Content-Range count).
 * Falls back to {@link PUBLIC_USER_COUNT_FALLBACK} on error / local mode.
 */
export function usePublicUserCount(): { count: number; isLive: boolean } {
  const [count, setCount] = useState(PUBLIC_USER_COUNT_FALLBACK);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (isLocalAppMode()) return;

    let cancelled = false;
    void (async () => {
      try {
        const { count: exact, error } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });
        if (cancelled || error || exact == null || exact < 1) return;
        setCount(exact);
        setIsLive(true);
      } catch {
        // Keep fallback.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { count, isLive };
}

export function formatPublicUserCountLabel(count: number, isLive: boolean): string {
  if (!isLive) return `${PUBLIC_USER_COUNT_FALLBACK}+`;
  return count.toLocaleString('en-US');
}
