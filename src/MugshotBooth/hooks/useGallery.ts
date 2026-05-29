// Rogue's Gallery — fetch mugshots across the 6 most-recent users.
//
// Each row's resource_data parses to a MugshotSave (cap 20 mugshots
// per user). We flatten ALL mugshots across ALL users, sort
// newest-first across authors, cap the display count, and resolve
// each unique user's profile once.
//
// We throttle at booking (already capped via the gen-image cost),
// never at display. See feedback_throttle_at_input_not_output —
// older mugshots stay in the rogue's gallery.

import { useCallback, useEffect, useState } from 'react';
import {
  callAigramAPI,
  isInAigram,
  telegramId,
  type AigramResponse,
} from '@shared/runtime/bridge';
import { getGameUuid } from '@shared/runtime/game-id';
import type { Mugshot, MugshotSave, WallEntry } from '../types';

interface SaveRow {
  user_id: string;
  time?: string;
  resource_data?: string;
}

export interface UseGallery {
  entries: WallEntry[];
  loaded: boolean;
  refresh: () => void;
}

export function useGallery(): UseGallery {
  const [entries, setEntries] = useState<WallEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const sessionId = getGameUuid();
    if (!isInAigram || !sessionId) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await callAigramAPI<AigramResponse<SaveRow[]>>(
          `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(sessionId)}`,
          'GET',
        );
        const rows = Array.isArray(res?.data) ? res.data : [];

        // Flatten ALL mugshots from each user's save row. Older
        // pattern only took mugshots[0] per user, which hid every
        // perp's prior bookings behind their newest. Throttle at
        // publish, never display.
        const pairs: Array<{ userId: string; mugshot: Mugshot }> = [];
        for (const row of rows) {
          if (!row.user_id || !row.resource_data) continue;
          try {
            const save = JSON.parse(row.resource_data) as MugshotSave;
            for (const m of save.mugshots || []) {
              if (m && m.imageUrl) {
                pairs.push({ userId: String(row.user_id), mugshot: m });
              }
            }
          } catch {
            /* skip corrupt row */
          }
        }
        // Newest first across all authors, cap visible count.
        pairs.sort((a, b) => (b.mugshot.createdAt ?? 0) - (a.mugshot.createdAt ?? 0));
        const limited = pairs.slice(0, 24);

        // Resolve each unique author's profile once.
        const uniqueIds = Array.from(new Set(limited.map(p => p.userId)));
        const profileEntries = await Promise.all(
          uniqueIds.map(async uid => {
            try {
              const r = await callAigramAPI<
                AigramResponse<{ name?: string; head_url?: string }>
              >(
                `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(uid)}`,
                'GET',
              );
              return [uid, r?.data ?? null] as const;
            } catch {
              return [uid, null] as const;
            }
          }),
        );
        const profileMap = new Map<string, { name?: string; head_url?: string } | null>(profileEntries);

        if (cancelled) return;
        setEntries(
          limited.map(({ userId, mugshot }) => {
            const p = profileMap.get(userId) || null;
            return {
              userId,
              userName: p?.name,
              userAvatarUrl: p?.head_url,
              mugshot,
            };
          }),
        );
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return { entries, loaded, refresh };
}

export function isSelf(entry: WallEntry): boolean {
  return !!telegramId && String(entry.userId) === String(telegramId);
}
