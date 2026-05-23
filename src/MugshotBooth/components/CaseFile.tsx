// CaseFile — the result screen. Hero is the 4-line headline charge
// passing through the red ring wash. Below: massive halftone mugshot,
// the GUILTY verdict stamp, supporting charges, plea, stats, actions.

import { useMemo } from 'react';
import HalftonePhoto from './HalftonePhoto';
import RedRingWash from './RedRingWash';
import MetaStrip from './MetaStrip';
import TicketStub from './TicketStub';
import Residue from './Residue';
import { t } from '../i18n';
import { playClick } from '../utils/audio';
import { splitHeadline } from '../utils/headline';
import type { Mugshot } from '../types';

interface Props {
  mugshot: Mugshot;
  viewMode: 'booking' | 'gallery';
  onNew: () => void;
  onWall: () => void;
  onShare?: () => void;
  shareLabel?: string;
  shareDisabled?: boolean;
}

export default function CaseFile({
  mugshot,
  viewMode: _viewMode,
  onNew,
  onWall,
  onShare,
  shareLabel,
  shareDisabled,
}: Props) {
  const { l1, l2, l3, l4 } = useMemo(
    () => splitHeadline(mugshot.charges.headline),
    [mugshot.charges.headline],
  );

  return (
    <>
      <Residue />
      <div className="mb-dash mb-dash--tl" aria-hidden="true">– – – –</div>
      <div className="mb-dash mb-dash--tr" aria-hidden="true">– – – –</div>
      <div className="mb-dash mb-dash--ml" aria-hidden="true">– – – –</div>
      <div className="mb-dash mb-dash--mr" aria-hidden="true">– – – –</div>

      <MetaStrip
        left="ALTERU PD"
        center={`CASE FILE · ${mugshot.bookingDate.replace(/-/g,'.')}`}
        right={shortCase(mugshot.caseNumber)}
      />
      <TicketStub>
        {mugshot.precinct} · INTAKE FORM A · OFFICER ALG-04
      </TicketStub>

      <div className="mb-stamp mb-stamp--solid" style={{ top: 38, right: 14, transform: 'rotate(4deg)' }}>
        WANTED
      </div>

      <RedRingWash style={{ position: 'absolute', top: 50 }} />

      <div className="mb-result__head">
        {l1 && <div className="mb-result__head__l1">{l1}</div>}
        {l2 && <div className="mb-result__head__l2">{l2}</div>}
        {l3 && <div className="mb-result__head__l3">{l3}</div>}
        {l4 && <div className="mb-result__head__l4">{l4}</div>}
      </div>

      <div className="mb-result__mug">
        <div className="mb-result__photo">
          {mugshot.imageUrl ? (
            <HalftonePhoto src={mugshot.imageUrl} width={320} height={400} />
          ) : (
            <div className="mb-result__photo-fallback">
              <span>PHOTO</span>
              <span>PENDING</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-stamp mb-stamp--solid is-red" style={{ top: 384, left: 14, transform: 'rotate(-10deg)' }}>
        EVIDENCE
      </div>

      <div className="mb-result__guilty mb-stamp mb-stamp--guilty">
        <div className="mb-stamp__big">{t(verdictKey(mugshot.verdict))}</div>
        <div className="mb-stamp__sub">ALTERU PD</div>
      </div>

      <div className="mb-result__body">
        <div className="mb-result__charges-label">{t('label_charges_further')}</div>
        <ol className="mb-result__charges">
          {mugshot.charges.supporting.slice(0, 3).map((c, i) => (
            <li key={i} data-n={['i','ii','iii','iv'][i]}>{c}</li>
          ))}
        </ol>
        <div className="mb-result__plea">{mugshot.charges.plea.replace(/^"|"$/g, '')}</div>
      </div>

      <div className="mb-result__stats">
        <span>HT<b>{stripParens(mugshot.height)}</b></span>
        <span>EYES<b>{mugshot.eyeColor.toUpperCase()}</b></span>
        <span>PCT<b>{precinctShort(mugshot.precinct)}</b></span>
      </div>

      <div className="mb-actions">
        <button
          type="button"
          className="mb-chip mb-chip--secondary"
          onPointerDown={() => { playClick(); onWall(); }}
        >
          {t('cta_wall_short')}
        </button>
        <button
          type="button"
          className="mb-chip mb-chip--primary"
          onPointerDown={() => { playClick(); onNew(); }}
        >
          {t('cta_new')}
        </button>
      </div>
      {/* SHARE wired but not in the action row — keep the 2-button layout
          consistent with the approved mockup. Re-add as a smaller icon
          action later if needed. */}
      {onShare ? <span style={{ display: 'none' }} data-label={shareLabel} aria-disabled={shareDisabled} /> : null}
    </>
  );
}

function verdictKey(v: Mugshot['verdict']): string {
  if (v === 'GUILTY') return 'verdict_guilty';
  if (v === 'AWAITING TRIAL') return 'verdict_awaiting';
  return 'verdict_bail';
}
function shortCase(caseNumber: string): string {
  const m = caseNumber.match(/-(\d+)$/);
  if (!m) return caseNumber;
  return `NO. ${m[1].slice(-3)}`;
}
function stripParens(s: string): string {
  return s.replace(/\s*\(.*\)\s*/, '').trim();
}
function precinctShort(precinct: string): string {
  // "PRECINCT 17: SLOW SIDE" → "17 · SLOW"
  const m = precinct.match(/PRECINCT\s*(\d+):?\s*(\w+)/i);
  if (!m) return precinct.slice(0, 12);
  return `${m[1]} · ${m[2].toUpperCase()}`;
}
