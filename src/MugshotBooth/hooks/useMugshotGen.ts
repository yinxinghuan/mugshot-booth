import { useCallback, useRef, useState } from 'react';
import { useGenImage, useUpload } from '@shared/runtime';
import { prepareSelfie } from '../utils/selfie';
import {
  CHARGES_SYSTEM,
  METADATA_SYSTEM,
  buildMugshotPrompt,
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
  const { generate: genImg } = useGenImage();
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
        // 1) Prepare + upload the selfie. Platform upload was repaired
        //    2026-05-23 (was 401 before). No fallback now — if upload
        //    fails we surface the error so we know immediately rather
        //    than silently degrading to txt2img.
        setStage('uploading');
        const prepared = await prepareSelfie(selfie);
        const uploaded = await upload(prepared, 'selfie.jpg');
        const selfieUrl = uploaded.url;

        // 2) Kick off charges + metadata LLM calls in parallel with image gen.
        //    The LLM calls finish in ~2-5s; the image gen takes ~60-180s.
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

        // Once charges resolve, advance to "booking" stage. Don't wait
        // for image gen yet — show the progress to the user.
        chargesPromise.then(() => setStage('booking'));

        // 3) The mug photo. If we have a selfie URL, do img2img (face match);
        //    otherwise txt2img with the same prompt (generic noir suspect).
        const imgPrompt = buildMugshotPrompt(caseNumber);
        const imagePromise = selfieUrl
          ? genImg({ prompt: imgPrompt, ref_url: selfieUrl })
          : genImg({ prompt: imgPrompt });

        const [charges, metadata, imageUrl] = await Promise.all([
          chargesPromise,
          metadataPromise,
          imagePromise,
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
    [genImg, upload],
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
