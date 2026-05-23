import { useCallback, useRef, useState } from 'react';
import { useUpload } from '@shared/runtime';
import { prepareSelfie } from '../utils/selfie';
import {
  CHARGES_SYSTEM,
  METADATA_SYSTEM,
  parseCharges,
  parseMetadata,
} from '../utils/prompts';
import { newMugshotId, rollVerdict, bookingDate } from '../utils/booking';
import type { Mugshot } from '../types';

const CHAT_URL = 'https://chat.aiwaves.tech/aigram/api/game-chat';

async function chatOnce(system: string, user: string): Promise<string> {
  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`chat failed: HTTP ${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? '';
}

export type Stage = '' | 'uploading' | 'charges' | 'booking' | 'stamping';

interface GenInput {
  selfie: File;
  caseNumber: string;
}

export interface UseMugshotGen {
  generate: (input: GenInput) => Promise<Mugshot>;
  loading: boolean;
  stage: Stage;
  error: Error | null;
}

export function useMugshotGen(): UseMugshotGen {
  const { upload } = useUpload();

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>('');
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(false);

  const generate = useCallback(
    async ({ selfie, caseNumber }: GenInput): Promise<Mugshot> => {
      if (inFlight.current) throw new Error('mugshot-gen: already in flight');
      inFlight.current = true;
      setLoading(true);
      setError(null);

      try {
        // 1) Prepare + upload the selfie. Platform upload repaired
        //    2026-05-23.
        setStage('uploading');
        const prepared = await prepareSelfie(selfie);
        const uploaded = await upload(prepared, 'selfie.jpg');
        const selfieUrl = uploaded.url;

        // 2) LLM calls for charges + metadata. (No AI image gen — see
        //    below.) Run in parallel; both finish in ~2-5s.
        setStage('charges');
        const seed = Math.random().toString(36).slice(2, 8);
        const userTurn = `New suspect — generate a fresh booking sheet. seed:${seed}`;

        const chargesPromise = (async () => {
          try {
            return parseCharges(await chatOnce(CHARGES_SYSTEM, userTurn));
          } catch {
            return parseCharges('');
          }
        })();

        const metadataPromise = (async () => {
          try {
            return parseMetadata(await chatOnce(METADATA_SYSTEM, userTurn));
          } catch {
            return parseMetadata('');
          }
        })();

        chargesPromise.then(() => setStage('booking'));

        // 3) NO img2img anymore. We tried wdabuliu's img2img with strong
        //    "preserve same face" prompts — it kept generating a generic
        //    person that didn't look like the actual uploaded selfie.
        //    The whole game falls apart if the suspect's face doesn't
        //    belong to the suspect.
        //
        //    Instead: use the uploaded selfie URL directly as the mug
        //    photo. HalftonePhoto's Riso canvas treatment + the case-file
        //    UI (red ring wash, GUILTY stamp, surrounding charges) is
        //    what carries the "mugshot" aesthetic. The user's actual
        //    face is guaranteed to appear because no AI is rewriting it.
        //
        //    Tradeoff: we lose the AI-generated background (precinct
        //    wall, height ruler, ALTERU PD placard in the photo). Could
        //    composite those back in with SVG overlays later.
        const imageUrl = selfieUrl;

        const [charges, metadata] = await Promise.all([
          chargesPromise,
          metadataPromise,
        ]);

        // 4) Pre-warm the image so the result page doesn't show a black tile.
        await preloadImage(imageUrl);

        setStage('stamping');
        // Brief settling beat — lets the typewriter / progress UI close out
        // cleanly before the result swap.
        await new Promise((r) => setTimeout(r, 350));

        const mugshot: Mugshot = {
          id: newMugshotId(),
          imageUrl,
          selfieUrl,
          charges,
          caseNumber,
          bookingDate: bookingDate(),
          height: metadata.height,
          eyeColor: metadata.eyeColor,
          precinct: metadata.precinct,
          verdict: rollVerdict(),
          createdAt: Date.now(),
        };
        return mugshot;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        inFlight.current = false;
        setLoading(false);
        setStage('');
      }
    },
    [upload],
  );

  return { generate, loading, stage, error };
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}
