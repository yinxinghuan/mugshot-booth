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

        // 3) img2img — restored with a subject-agnostic prompt.
        //
        //    Previous prompts described the suspect as a person ("face,
        //    head and shoulders, tired eyes") which led the API to
        //    IGNORE the ref and generate a generic human, even when
        //    the user uploaded a cat. The new buildMugshotPrompt()
        //    describes only the SCENE (placard, wall, ruler, lighting,
        //    film stock) and asserts that the ref IS the suspect. Now
        //    the AI puts whatever the user uploaded — cat / face / dog
        //    / plush — into the booking room.
        const imgPrompt = buildMugshotPrompt(caseNumber);
        const imagePromise = genImg({ prompt: imgPrompt, ref_url: selfieUrl });

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
