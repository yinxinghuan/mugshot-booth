import { t } from '../i18n';
import { playClick } from '../utils/audio';
import StampBadge from './StampBadge';
import type { Mugshot, WallEntry } from '../types';

interface Props {
  community: WallEntry[];
  mine: Mugshot[];
  loaded: boolean;
  onBack: () => void;
  onView: (entry: WallEntry) => void;
  onNew: () => void;
}

export default function Gallery({ community, mine, loaded, onBack, onView, onNew }: Props) {
  const hasEntries = community.length > 0;

  return (
    <div className="mb-gallery">
      <div className="mb-gallery__header">
        <button
          type="button"
          className="mb-btn mb-btn--ghost mb-btn--small"
          onPointerDown={() => { playClick(); onBack(); }}
        >
          ‹ {t('cta_back')}
        </button>
        <div className="mb-gallery__title">{t('wall_title')}</div>
        <div className="mb-gallery__case-count">
          {String(community.length).padStart(2, '0')} ON FILE
        </div>
      </div>

      <div className="mb-gallery__board">
        {!loaded ? (
          <div className="mb-gallery__empty">developing…</div>
        ) : !hasEntries ? (
          <div className="mb-gallery__empty">{t('wall_empty')}</div>
        ) : (
          community.map((entry, i) => (
            <button
              key={`${entry.userId}-${entry.mugshot.id}`}
              type="button"
              className="mb-gallery__card"
              style={{ '--tilt': `${tiltFor(i)}deg` } as React.CSSProperties}
              onPointerDown={() => onView(entry)}
            >
              <div className="mb-gallery__tape" />
              <div className="mb-gallery__card-photo">
                <img
                  src={entry.mugshot.imageUrl}
                  alt={`mugshot of ${entry.userName || 'suspect'}`}
                  draggable={false}
                />
                <div className="mb-gallery__card-stamp">
                  <StampBadge verdict={entry.mugshot.verdict} />
                </div>
              </div>
              <div className="mb-gallery__card-meta">
                <div className="mb-gallery__card-name">
                  {entry.userName ? entry.userName.toUpperCase() : 'JOHN DOE'}
                </div>
                <div className="mb-gallery__card-case">{entry.mugshot.caseNumber}</div>
                <div className="mb-gallery__card-headline">
                  {entry.mugshot.charges.headline}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {mine.length > 0 && (
        <div className="mb-gallery__own">
          <span>YOUR RAP SHEET: {mine.length}</span>
        </div>
      )}

      <div className="mb-gallery__actions">
        <button
          type="button"
          className="mb-btn mb-btn--primary"
          onPointerDown={() => { playClick(); onNew(); }}
        >
          {t('cta_new')}
        </button>
      </div>
    </div>
  );
}

function tiltFor(i: number): number {
  // Pseudo-random small tilt; same index always gets same tilt so the
  // board feels physical (tape doesn't squirm between renders).
  const seq = [-3.2, 2.7, -1.8, 4.1, -2.4, 1.6];
  return seq[i % seq.length];
}
