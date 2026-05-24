// Rogue's Gallery — wall of recent suspects from across Aigram.
// Tap a card → opens that user's Aigram profile (via openAigramProfile
// bridge). Each card has a different red wash shape behind the halftone
// photo for visual variety.

import { useMemo } from 'react';
import HalftonePhoto from './HalftonePhoto';
import RedRingWash from './RedRingWash';
import MetaStrip from './MetaStrip';
import TicketStub from './TicketStub';
import Residue from './Residue';
import { openAigramProfile, isInAigram, telegramId } from '@shared/runtime';
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

export default function Gallery({ community, mine, loaded, onBack, onView, onNew }: Props) {
  // Merge: my full local history + community's other users.
  //
  // The platform get/data/list only returns the LATEST save per user
  // (≤6 users), so my older bookings (and sometimes even my newest, if
  // I'm not in the most recent 6 users) wouldn't show in the gallery
  // without this merge. Same fix pattern as the album-cover-generator
  // wall — see project_album_cover_generator.md.
  const myTid = telegramId ? String(telegramId) : '';
  const entries: WallEntry[] = useMemo(() => {
    const myEntries: WallEntry[] = mine.map((m) => ({
      userId: 'self',
      userName: 'YOU',
      userAvatarUrl: undefined,
      mugshot: m,
    }));
    const others = myTid ? community.filter((e) => e.userId !== myTid) : community;
    return [...myEntries, ...others].sort(
      (a, b) => (b.mugshot.createdAt || 0) - (a.mugshot.createdAt || 0),
    );
  }, [mine, community, myTid]);

  const hasEntries = entries.length > 0;

  // Split clicks: photo → open the mugshot case file (in-game detail view).
  //               name/case/charge → open the suspect's Aigram profile
  //               (falls back to case file for self/demo entries).
  // Tapping the whole card used to route to profile, hiding the published
  // mugshot. See feedback_nested_clickables_in_lists.md for the pattern.
  const handlePhotoTap = (entry: WallEntry) => {
    playClick();
    onView(entry);
  };
  const handleNameTap = (entry: WallEntry) => {
    playClick();
    if (isInAigram && entry.userId && entry.userId !== 'self' && !entry.userId.startsWith('demo-')) {
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
        center={`SUSPECTS ON FILE · ${String(entries.length).padStart(2, '0')}`}
        right={todayShort()}
      />
      <TicketStub>PRECINCT 17 · MOST WANTED · LOOK OFTEN · STAY ALERT</TicketStub>

      {/* Smaller wash than the other screens — the gallery board starts
          at y=264 and the cards must not be visually covered by the
          wash. A 250px ring sitting at y=58 bottoms out at y=308, well
          inside the title area, leaving the cards clean. */}
      <RedRingWash size={250} style={{ position: 'absolute', top: 58 }} />

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
          entries.map((entry, i) => (
            <div key={`${entry.userId}-${entry.mugshot.id}`} className="mb-gal__card">
              {/* photo → opens this user's mugshot detail (case file) */}
              <button
                type="button"
                className="mb-gal__card-photo mb-gal__card-photo--btn"
                // onClick (not onPointerDown) so scroll gestures don't fire
                // taps. See feedback_onclick_for_scrollable_lists.md
                onClick={() => handlePhotoTap(entry)}
              >
                <WashBg shape={SHAPES[i % SHAPES.length]} />
                {entry.mugshot.imageUrl ? (
                  <HalftonePhoto src={entry.mugshot.imageUrl} width={172} height={215} />
                ) : null}
                <div className="mb-gal__card-guilty">{t('verdict_guilty_short')}</div>
              </button>
              {/* name + case + charge → opens this user's Aigram profile */}
              <button
                type="button"
                className="mb-gal__card-text"
                onClick={() => handleNameTap(entry)}
              >
                <div className="mb-gal__card-name">
                  {(entry.userName || 'JOHN DOE').toUpperCase()}
                </div>
                <div className="mb-gal__card-case">{entry.mugshot.caseNumber}</div>
                <div className="mb-gal__card-charge">
                  {entry.mugshot.charges.headline}
                </div>
              </button>
            </div>
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
