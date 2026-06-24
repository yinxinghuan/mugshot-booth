// CaseFile — the result screen. Hero is the 4-line headline charge
// passing through the red ring wash. Below: massive halftone mugshot,
// the GUILTY verdict stamp, supporting charges, plea, stats, actions.

import { useMemo, useState } from 'react';
import HalftonePhoto from './HalftonePhoto';
import RedRingWash from './RedRingWash';
import MetaStrip from './MetaStrip';
import TicketStub from './TicketStub';
import Residue from './Residue';
import { t, currentLocale } from '../i18n';
import { playClick } from '../utils/audio';
import { splitHeadline } from '../utils/headline';
import { openAigramProfile, isInAigram } from '@shared/runtime';
import { timeAgo, type GuestMessage } from '@shared/social/guestbook';
import type { Mugshot, WallEntry } from '../types';

interface Props {
  mugshot: Mugshot;
  viewMode: 'booking' | 'gallery';
  /** Author of this mugshot, when viewed from the gallery (null for own booking). */
  author?: WallEntry | null;
  /** This player's id — render own notes as "you", skip self profile tap. */
  selfUserId?: string;
  /** Public guestbook notes on this mugshot (wall ∪ mine, oldest-first). */
  thread?: GuestMessage[];
  /** Leave a note on this mugshot. */
  onSend?: (text: string) => void;
  onNew: () => void;
  onWall: () => void;
  onShare?: () => void;
  shareLabel?: string;
  shareDisabled?: boolean;
}

export default function CaseFile({
  mugshot,
  viewMode,
  selfUserId,
  thread = [],
  onSend,
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
  const [notesOpen, setNotesOpen] = useState(false);

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
        {viewMode === 'gallery' ? (
          <button
            type="button"
            className="mb-chip mb-chip--secondary"
            onPointerDown={() => { playClick(); setNotesOpen(true); }}
          >
            {t('notes_cta')}{thread.length > 0 ? ` · ${thread.length}` : ''}
          </button>
        ) : (
          <button
            type="button"
            className="mb-chip mb-chip--secondary"
            onPointerDown={() => { playClick(); onWall(); }}
          >
            {t('cta_wall_short')}
          </button>
        )}
        <button
          type="button"
          className="mb-chip mb-chip--primary"
          onPointerDown={() => { playClick(); onNew(); }}
        >
          {t('cta_new')}
        </button>
      </div>

      {notesOpen && (
        <NotesModal
          thread={thread}
          selfUserId={selfUserId}
          canSend={isInAigram && !!onSend}
          onSend={onSend}
          onClose={() => { playClick(); setNotesOpen(false); }}
        />
      )}
      {/* SHARE wired but not in the action row — keep the 2-button layout
          consistent with the approved mockup. Re-add as a smaller icon
          action later if needed. */}
      {onShare ? <span style={{ display: 'none' }} data-label={shareLabel} aria-disabled={shareDisabled} /> : null}
    </>
  );
}

// Guestbook overlay — lightweight modal mirroring bubble-wrap's SlipDetail.
// The case file itself is a fixed-position noir layout, so notes live in an
// overlay rather than inline. Close on backdrop tap or the × button.
function NotesModal({
  thread,
  selfUserId,
  canSend,
  onSend,
  onClose,
}: {
  thread: GuestMessage[];
  selfUserId?: string;
  canSend: boolean;
  onSend?: (text: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="mb-notes" onClick={onClose}>
      <div className="mb-notes__card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mb-notes__close" onClick={onClose} aria-label="close">×</button>
        <div className="mb-notes__eyebrow">
          {t('notes_title')}{thread.length > 0 ? ` · ${thread.length}` : ''}
        </div>
        {thread.length > 0 ? (
          <ul className="mb-notes__list">
            {thread.map((m) => (
              <NoteRow key={m.id} msg={m} selfUserId={selfUserId} />
            ))}
          </ul>
        ) : (
          <div className="mb-notes__empty">{t('notes_empty')}</div>
        )}
        {canSend && onSend ? (
          <Compose onSend={onSend} />
        ) : (
          <div className="mb-notes__empty">{t('notes_signedout')}</div>
        )}
      </div>
    </div>
  );
}

// One guestbook note: author chip (tappable → profile; self shows "you"),
// text, time. onClick + stopPropagation (scroll-vs-click skill).
function NoteRow({ msg, selfUserId }: { msg: GuestMessage; selfUserId?: string }) {
  const mine = !!msg.fromUserId && msg.fromUserId === selfUserId;
  const name = mine ? t('notes_you') : (msg.userName || t('notes_someone'));
  const initial = (msg.userName || '?').slice(0, 1).toUpperCase();
  const tappable = !mine && !!msg.fromUserId && isInAigram;
  const head = (
    <span className="mb-note__head">
      {msg.userAvatarUrl ? (
        <img className="mb-note__avatar" src={msg.userAvatarUrl} alt="" draggable={false} />
      ) : (
        <span className="mb-note__avatar mb-note__avatar--letter">{initial}</span>
      )}
      <span className={`mb-note__name${mine ? ' mb-note__name--self' : ''}`}>{name}</span>
      <span className="mb-note__time">{timeAgo(msg.ts, currentLocale())}</span>
    </span>
  );
  return (
    <li className="mb-note">
      {tappable ? (
        <button
          type="button"
          className="mb-note__chip"
          onClick={(e) => { e.stopPropagation(); openAigramProfile(msg.fromUserId!); }}
        >
          {head}
        </button>
      ) : head}
      <p className="mb-note__text">{msg.text}</p>
    </li>
  );
}

// Compose box — controlled input + send glyph.
function Compose({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const submit = () => {
    const v = text.trim();
    if (!v) return;
    playClick();
    onSend(v);
    setText('');
  };
  return (
    <div className="mb-compose" onClick={(e) => e.stopPropagation()}>
      <input
        className="mb-compose__input"
        value={text}
        maxLength={140}
        placeholder={t('notes_placeholder')}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
      />
      <button
        type="button"
        className="mb-compose__send"
        disabled={!text.trim()}
        onClick={submit}
      >
        {t('notes_send')}
      </button>
    </div>
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
