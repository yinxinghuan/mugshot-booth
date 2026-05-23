// Rogue's Gallery — fetch the 6 most-recent users' latest mugshot.
//
// Wire: get/data/list?session_id=<gameUUID> returns up to 6 most-recent
// users' latest save row. Each row's resource_data parses to a
// MugshotSave; we take its newest mugshot. Then resolve names + avatars
// in parallel.

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

        const parsed: Array<{ row: SaveRow; mugshot: Mugshot }> = [];
        for (const row of rows) {
          if (!row.user_id || !row.resource_data) continue;
          try {
            const save = JSON.parse(row.resource_data) as MugshotSave;
            const m = save.mugshots?.[0];
            if (m && m.imageUrl) parsed.push({ row, mugshot: m });
          } catch {
            /* skip corrupt row */
          }
          if (parsed.length >= 6) break;
        }

        const profiles = await Promise.all(
          parsed.map(({ row }) =>
            callAigramAPI<AigramResponse<{ name?: string; head_url?: string }>>(
              `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(row.user_id)}`,
              'GET',
            ).catch(() => null),
          ),
        );

        if (cancelled) return;
        setEntries(
          parsed.map(({ row, mugshot }, i) => ({
            userId: row.user_id,
            userName: profiles[i]?.data?.name,
            userAvatarUrl: profiles[i]?.data?.head_url,
            mugshot,
          })),
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
  return !!telegramId && entry.userId === String(telegramId);
}
