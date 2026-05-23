// Split an LLM-generated headline charge into 4 visual lines for the
// hand-painted display layout (mockup A).
//
// Target shape:
//   line 1 — "LEAD"   (the first lexical chunk, medium-large)
//   line 2 — "MID-A"  (largest)
//   line 3 — "MID-B"  (smallest, used for connectors like "INTENT TO")
//   line 4 — "PUNCH"  (large, the climax word, can render in red)
//
// Algorithm: tokenize, identify a "connector" pivot (first preposition or
// conjunction after the first content word). The connector and the words
// before the final content word go into the small line-3 slot. The first
// content word is line-1, the climax (last content word) is line-4, and
// the loud middle word goes to line-2.
//
// Examples:
//   "LOITERING WITH INTENT TO VIBE"
//     → l1=LOITERING   l2=WITH       l3=INTENT TO   l4=VIBE
//   "POSSESSION OF UNSENT TEXTS"
//     → l1=POSSESSION  l2=OF         l3=UNSENT      l4=TEXTS
//   "PUBLIC CRYING WITHOUT PERMIT"
//     → l1=PUBLIC      l2=CRYING     l3=WITHOUT     l4=PERMIT
//   "OPERATING A PERSONALITY UNDER THE INFLUENCE"
//     → l1=OPERATING   l2=PERSONALITY l3=UNDER THE   l4=INFLUENCE
//   "GRAND THEFT EMOTIONAL"
//     → l1=GRAND       l2=THEFT       l3=—           l4=EMOTIONAL
//   "VIBES"
//     → l1=—           l2=—           l3=—           l4=VIBES

export interface HeadlineSplit {
  l1: string;
  l2: string;
  l3: string;
  l4: string;
}

const CONNECTORS = new Set([
  'with', 'without', 'of', 'in', 'on', 'at', 'to', 'for', 'by', 'from',
  'under', 'over', 'into', 'onto', 'a', 'an', 'the', 'and', 'or', 'as',
]);

function isConnector(w: string): boolean {
  return CONNECTORS.has(w.toLowerCase());
}

export function splitHeadline(raw: string): HeadlineSplit {
  const words = (raw || '').trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return { l1: '', l2: '', l3: '', l4: '' };
  }
  if (words.length === 1) {
    return { l1: '', l2: '', l3: '', l4: words[0] };
  }
  if (words.length === 2) {
    return { l1: words[0], l2: '', l3: '', l4: words[1] };
  }
  if (words.length === 3) {
    return { l1: words[0], l2: words[1], l3: '', l4: words[2] };
  }

  // 4+ words: place last word in l4, first word in l1, look for a
  // connector to anchor l3, rest goes to l2 (the loud middle).
  const first = words[0];
  const last = words[words.length - 1];
  const middle = words.slice(1, -1);

  // Find the last connector index in the middle; everything from there
  // through the end of the middle goes to l3 (the "small connector" line).
  let connectorIdx = -1;
  for (let i = middle.length - 1; i >= 0; i--) {
    if (isConnector(middle[i])) {
      connectorIdx = i;
      break;
    }
  }

  let l2 = '';
  let l3 = '';
  if (connectorIdx >= 0) {
    l2 = middle.slice(0, connectorIdx).join(' ');
    l3 = middle.slice(connectorIdx).join(' ');
  } else {
    // No connector — fall back to: first middle word → l2, rest → l3
    l2 = middle[0];
    l3 = middle.slice(1).join(' ');
  }

  // Edge case: if l2 ended up empty (e.g. connector was at index 0), shift
  // — put the connector in l2 and leave l3 empty.
  if (!l2 && l3) {
    const l3words = l3.split(/\s+/);
    l2 = l3words[0];
    l3 = l3words.slice(1).join(' ');
  }

  return {
    l1: first.toUpperCase(),
    l2: l2.toUpperCase(),
    l3: l3.toUpperCase(),
    l4: last.toUpperCase(),
  };
}
