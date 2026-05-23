// Mugshot Booth — LLM + image prompts.
//
// Two LLM calls (parallelized in the hook):
//   1) CHARGES_SYSTEM     — JSON: { headline, supporting[], distinguishingMarks, plea }
//   2) METADATA_SYSTEM    — JSON: { height, eyeColor, precinct }
//
// One image gen call: img2img with the uploaded selfie as ref + MUGSHOT_PROMPT.

// ─── Charges — the comedic core ────────────────────────────────────────────

export const CHARGES_SYSTEM = `You are the booking sergeant of the AlterU Vice Squad, a precinct that arrests people for existential, vibe-based, and emotionally absurd offences. Your job is to type up the suspect's charge sheet.

Output ONE JSON object with these four fields:

{
  "headline": "<the headline charge, ALL CAPS, 4-8 words. Existential dark humour. Examples: 'LOITERING WITH INTENT TO VIBE', 'POSSESSION OF UNSENT TEXTS', 'PUBLIC CRYING WITHOUT PERMIT', 'OPERATING A PERSONALITY UNDER THE INFLUENCE', 'DISORDERLY HOPE IN THE FIRST DEGREE', 'GRAND THEFT EMOTIONAL'>",
  "supporting": ["<count 2, sentence-case, 4-9 words>", "<count 3, sentence-case, 4-9 words>", "<count 4, sentence-case, 4-9 words>"],
  "distinguishingMarks": "<one sentence describing the suspect's distinguishing marks, in case-file deadpan. Mix banal physical detail with emotional or existential observation. 12-20 words. Examples: 'Faint scar above left eyebrow; carries the posture of a man who reads his own horoscope.' or 'Tattoo of forgotten password on right wrist; eyes hold the weather of an unread email.'>",
  "plea": "<one sentence the suspect said when arrested, in quotation marks. 6-15 words. Should feel deflective, philosophical, or sad. Examples: 'It wasn't me. It was vibes.' / 'I was just trying to make it to Tuesday.' / 'You'd have done the same thing in my shoes.'>"
}

Tone rules:
- Dark, dry, deadpan — like a real police blotter being read on a podcast.
- Existential and emotional offences only — never violent, never sexual, never targeted at protected classes.
- No politics, no real names, no profanity.
- Make each booking feel unique — don't reuse charges between calls.
- Charges should feel like things ANYONE could be guilty of in a quiet way.

Output ONLY the JSON object. No markdown fences, no prose, no trailing commentary.`;

export const METADATA_SYSTEM = `You generate the physical-description fields for a mugshot booking sheet at the AlterU Vice Squad — a precinct that books people for vibe crimes.

Output ONE JSON object with these three fields:

{
  "height": "<absurd or impossible height in feet/inches. Examples: '5\\'09\\" (when asked)', '6\\'02\\" but slouching', 'Just under regret', 'Two parking meters tall'>",
  "eyeColor": "<implausible eye color, lower case, 2-5 words. Examples: 'low-tide brown', 'overcast', 'the color of a closed bookstore', 'wifi-bar grey', 'expired-loyalty-card hazel'>",
  "precinct": "<a fake AlterU precinct name, format 'PRECINCT <number>: <neighborhood>'. Number 1-99. Neighborhood is melancholic / mundane. Examples: 'PRECINCT 17: SLOW SIDE', 'PRECINCT 04: LATE NIGHT GROCERIES', 'PRECINCT 23: GHOSTED LANE', 'PRECINCT 81: APRIL OF NO YEAR'>"
}

Output ONLY the JSON object. No markdown, no prose.`;

// ─── Image — mugshot photo prompt ─────────────────────────────────────────

/**
 * Build the img2img prompt for the mugshot photograph. The ref is the
 * uploaded selfie (subject's face). Output is a B&W noir mugshot framed
 * with an ID board.
 *
 * Note: the gen-image endpoint will use the ref image's aspect ratio.
 * We crop the selfie to 4:5 portrait before upload (see selfie.ts) so
 * the output portrait sits naturally on the case file.
 */
export function buildMugshotPrompt(caseNumber: string): string {
  // PROMPT STRUCTURE NOTE (Mugshot Booth v2.1, 2026-05-24):
  //
  // The wdabuliu img2img API heavily weights the prompt — long style
  // descriptions can override the reference's identity, producing a
  // generic person instead of the actual uploaded face. To preserve
  // face similarity we:
  //   1. Lead with explicit identity-preservation instructions
  //   2. Keep style descriptors short
  //   3. End by reiterating "same face as reference"
  return [
    // ─── Identity preservation (HIGHEST PRIORITY) ──────────────
    'IMPORTANT: keep the exact same face as the reference image —',
    'same facial features, same hair, same skin tone, same age, same identity.',
    'Do NOT generate a different person. The output MUST clearly look like the person in the reference.',
    // ─── What changes (style + scenery) ──────────────────────
    'Convert the reference photo into a black-and-white police mugshot:',
    'subject faces the camera straight-on, deadpan neutral expression,',
    'holding a cream cardboard inmate ID placard at chest level with bold',
    `black stenciled text reading "ALTERU PD" and "${caseNumber}" (legible).`,
    'Background: scuffed concrete wall with vertical height ruler.',
    'Lighting: single overhead booking-room fluorescent, high contrast.',
    '35mm film grain, vintage 1970s precinct booking photo aesthetic.',
    'Desaturated black-and-white only, no color tint.',
    'Vertical portrait, 4:5 aspect ratio, no border, no extra text.',
    // ─── Identity reminder ──────────────────────────────────
    'Again: the face MUST match the reference image exactly — same person.',
  ].join(' ');
}

// ─── Parsers ───────────────────────────────────────────────────────────────

export interface ParsedCharges {
  headline: string;
  supporting: string[];
  distinguishingMarks: string;
  plea: string;
}

const FALLBACK_CHARGES: ParsedCharges[] = [
  {
    headline: 'LOITERING WITH INTENT TO VIBE',
    supporting: [
      'Failure to maintain eye contact during obligation',
      'Possession of unsent texts after midnight',
      'Disorderly hope in the first degree',
    ],
    distinguishingMarks: "Faint scar above left eyebrow; carries the posture of someone who reads their own horoscope.",
    plea: '"It wasn\'t me. It was vibes."',
  },
  {
    headline: 'PUBLIC CRYING WITHOUT PERMIT',
    supporting: [
      'Operating a personality under the influence',
      'Aggravated emotional unavailability',
      'Trespassing in the past tense',
    ],
    distinguishingMarks: 'Tattoo of a forgotten password on left wrist; eyes hold the weather of an unread email.',
    plea: '"I was just trying to make it to Tuesday."',
  },
];

export function parseCharges(raw: string): ParsedCharges {
  if (!raw) return pickFallback();
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return pickFallback();
  try {
    const obj = JSON.parse(m[0]);
    const headline =
      typeof obj.headline === 'string' && obj.headline.trim().length >= 4
        ? obj.headline.trim().toUpperCase()
        : pickFallback().headline;
    const supporting = Array.isArray(obj.supporting)
      ? obj.supporting
          .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length >= 3)
          .slice(0, 4)
          .map((s: string) => s.trim())
      : pickFallback().supporting;
    const distinguishingMarks =
      typeof obj.distinguishingMarks === 'string' && obj.distinguishingMarks.trim().length >= 8
        ? obj.distinguishingMarks.trim()
        : pickFallback().distinguishingMarks;
    let plea =
      typeof obj.plea === 'string' && obj.plea.trim().length >= 4
        ? obj.plea.trim()
        : pickFallback().plea;
    // Ensure plea is wrapped in quotation marks.
    if (!plea.startsWith('"') && !plea.startsWith('“')) plea = `"${plea}"`;
    if (!/[\"”]$/.test(plea)) plea = `${plea}"`;
    return {
      headline,
      supporting: supporting.length >= 2 ? supporting : pickFallback().supporting,
      distinguishingMarks,
      plea,
    };
  } catch {
    return pickFallback();
  }
}

export interface ParsedMetadata {
  height: string;
  eyeColor: string;
  precinct: string;
}

const FALLBACK_METADATA: ParsedMetadata[] = [
  { height: "5'09\" (when asked)", eyeColor: 'wifi-bar grey', precinct: 'PRECINCT 17: SLOW SIDE' },
  { height: "6'02\" but slouching", eyeColor: 'low-tide brown', precinct: 'PRECINCT 04: LATE NIGHT GROCERIES' },
  { height: 'Just under regret', eyeColor: 'overcast', precinct: 'PRECINCT 81: APRIL OF NO YEAR' },
];

export function parseMetadata(raw: string): ParsedMetadata {
  const fb = FALLBACK_METADATA[Math.floor(Math.random() * FALLBACK_METADATA.length)];
  if (!raw) return fb;
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return fb;
  try {
    const obj = JSON.parse(m[0]);
    return {
      height: typeof obj.height === 'string' && obj.height.trim() ? obj.height.trim() : fb.height,
      eyeColor:
        typeof obj.eyeColor === 'string' && obj.eyeColor.trim()
          ? obj.eyeColor.trim().toLowerCase()
          : fb.eyeColor,
      precinct:
        typeof obj.precinct === 'string' && obj.precinct.trim()
          ? obj.precinct.trim().toUpperCase()
          : fb.precinct,
    };
  } catch {
    return fb;
  }
}

function pickFallback(): ParsedCharges {
  return FALLBACK_CHARGES[Math.floor(Math.random() * FALLBACK_CHARGES.length)];
}
