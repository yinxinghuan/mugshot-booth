// Hand-painted Knewave headline split into 4 lines with mixed sizes,
// passing through the red wash ring as a Riso overprint (multiply blend).
// Wraps splitHeadline() — caller passes the raw uppercase headline.

import { splitHeadline } from '../utils/headline';

interface Props {
  headline: string;
}

export default function HeroHeadline({ headline }: Props) {
  const { l1, l2, l3, l4 } = splitHeadline(headline);
  return (
    <div className="mb-hero" aria-label={headline}>
      {l1 && <div className="mb-hero__l1">{l1}</div>}
      {l2 && <div className="mb-hero__l2">{l2}</div>}
      {l3 && <div className="mb-hero__l3">{l3}</div>}
      {l4 && <div className="mb-hero__l4">{l4}</div>}
    </div>
  );
}
