// Rogue's Gallery — wall of recent suspects from across Aigram.
// Tap a card → opens that user's Aigram profile (via openAigramProfile
// bridge). Each card has a different red wash shape behind the halftone
// photo for visual variety.

import HalftonePhoto from './HalftonePhoto';
import RedRingWash from './RedRingWash';
import MetaStrip from './MetaStrip';
import TicketStub from './TicketStub';
import Residue from './Residue';
import { openAigramProfile, isInAigram } from '@shared/runtime';
import { t } from '../i18n';
import { playClick } from '../utils/audio';
import type { Mugshot, WallEntry } from '../types';

interface Props {
  community: WallEntry[];
  mine: Mugshot[];
  loaded: boolean;
  onBack: () => void;
  onView: (entry: WallEntry) => void;
  onNew: () => void;
}

type WashShape = 'disc' | 'none' | 'rect' | 'arc' | 'ring' | 'triangle';
const SHAPES: WashShape[] = ['disc', 'none', 'rect', 'arc', 'ring', 'triangle'];

export default function Gallery({ community, mine: _mine, loaded, onBack, onView, onNew }: Props) {
  const hasEntries = community.length > 0;

  const handleCardTap = (entry: WallEntry) => {
    playClick();
    // Open the suspect's Aigram profile if we're inside the iframe; else
    // fall back to the in-game case-file view.
    if (isInAigram && entry.userId && !entry.userId.startsWith('demo-')) {
      openAigramProfile(entry.userId);
    } else {
      onView(entry);
    }
  };

  return (
    <>
      <Residue />
      <div className="mb-dash mb-dash--tl" aria-hidden="true">– – – –</div>
      <div className="mb-dash mb-dash--tr" aria-hidden="true">– – – –</div>

      <MetaStrip
        left="ALTERU PD"
        center={`SUSPECTS ON FILE · ${String(community.length).padStart(2, '0')}`}
        right={todayShort()}
      />
      <TicketStub>PRECINCT 17 · MOST WANTED · LOOK OFTEN · STAY ALERT</TicketStub>

      <RedRingWash style={{ position: 'absolute', top: 60 }} />

      <div className="mb-gal__head">
        <div className="mb-gal__head__l1">ROGUE'S</div>
        <div className="mb-gal__head__l2">GALLERY</div>
      </div>

      <div
        className="mb-stamp mb-stamp--solid is-red"
        style={{ top: 38, right: 14, transform: 'rotate(4deg)' }}
      >
        MOST WANTED
      </div>

      <div className="mb-gal__board">
        {!loaded ? (
          <div className="mb-gal__empty">developing…</div>
        ) : !hasEntries ? (
          <div className="mb-gal__empty">{t('wall_empty')}</div>
        ) : (
          community.map((entry, i) => (
            <button
              key={`${entry.userId}-${entry.mugshot.id}`}
              type="button"
              className="mb-gal__card"
              onPointerDown={() => handleCardTap(entry)}
            >
              <div className="mb-gal__card-photo">
                <WashBg shape={SHAPES[i % SHAPES.length]} />
                {entry.mugshot.imageUrl ? (
                  <HalftonePhoto src={entry.mugshot.imageUrl} width={172} height={215} />
                ) : null}
                <div className="mb-gal__card-guilty">{t('verdict_guilty_short')}</div>
              </div>
              <div className="mb-gal__card-name">
                {(entry.userName || 'JOHN DOE').toUpperCase()}
              </div>
              <div className="mb-gal__card-case">{entry.mugshot.caseNumber}</div>
              <div className="mb-gal__card-charge">
                {entry.mugshot.charges.headline}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="mb-actions">
        <button
          type="button"
          className="mb-chip mb-chip--secondary"
          onPointerDown={() => { playClick(); onBack(); }}
        >
          ‹ {t('cta_back')}
        </button>
        <button
          type="button"
          className="mb-chip mb-chip--primary"
          onPointerDown={() => { playClick(); onNew(); }}
        >
          {t('cta_new')}
        </button>
      </div>
    </>
  );
}

function WashBg({ shape }: { shape: WashShape }) {
  if (shape === 'none') return null;
  const W = 100;
  const H = 125;
  const inner = (() => {
    switch (shape) {
      case 'disc':
        return <circle cx="50" cy="62.5" r="56" />;
      case 'rect':
        return (
          <g transform="rotate(-8 50 62.5)">
            <rect x="6" y="14" width="88" height="100" />
          </g>
        );
      case 'arc':
        return <path d="M 100 30 A 70 70 0 0 0 10 110 L 110 110 L 110 30 Z" />;
      case 'ring':
        return (
          <>
            <circle cx="50" cy="62.5" r="56" />
            <circle cx="50" cy="62.5" r="30" fill="#fefcf3" />
          </>
        );
      case 'triangle':
        return <polygon points="-8,2 108,2 50,130" />;
      default:
        return <circle cx="50" cy="62.5" r="56" />;
    }
  })();
  return (
    <svg
      className="mb-gal__wash-bg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g>{inner}</g>
    </svg>
  );
}

function todayShort(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}
