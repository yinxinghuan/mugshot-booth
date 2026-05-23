import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { playStamp, playClick } from '../utils/audio';
import StampBadge from './StampBadge';
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
  viewMode,
  onNew,
  onWall,
  onShare,
  shareLabel,
  shareDisabled,
}: Props) {
  // Stamp lands ~600ms after mount (fresh booking only).
  const [stamped, setStamped] = useState(viewMode === 'gallery');
  useEffect(() => {
    if (viewMode === 'gallery') return;
    const id = setTimeout(() => {
      setStamped(true);
      playStamp();
    }, 700);
    return () => clearTimeout(id);
  }, [viewMode]);

  return (
    <div className="mb-case">
      <div className="mb-case__paper">
        <div className="mb-case__header">
          <div className="mb-case__brand">
            <div className="mb-case__brand-title">ALTERU POLICE DEPT.</div>
            <div className="mb-case__brand-sub">CONFIDENTIAL · CASE FILE</div>
          </div>
          <div className="mb-case__case-no">
            <div className="mb-case__case-label">{t('label_case')}</div>
            <div className="mb-case__case-val">{mugshot.caseNumber}</div>
          </div>
        </div>

        <div className="mb-case__body">
          <div className="mb-case__photo-block">
            <div className="mb-case__photo-frame">
              {mugshot.imageUrl ? (
                <img
                  className="mb-case__photo"
                  src={mugshot.imageUrl}
                  alt="mugshot"
                  draggable={false}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
              <div className="mb-case__photo-placeholder">
                <span>PHOTO</span>
                <span>PENDING</span>
              </div>
              <div className="mb-case__photo-corners">
                <span /><span /><span /><span />
              </div>
            </div>
            <div className="mb-case__photo-caption">
              FRONT VIEW — INTAKE
            </div>
          </div>

          <div className="mb-case__info">
            <InfoRow label={t('label_date')} value={mugshot.bookingDate} />
            <InfoRow label={t('label_height')} value={mugshot.height} />
            <InfoRow label={t('label_eyes')} value={mugshot.eyeColor} />
            <InfoRow label={t('label_precinct')} value={mugshot.precinct} />
            <div className="mb-case__section-label">{t('label_marks')}</div>
            <div className="mb-case__marks">{mugshot.charges.distinguishingMarks}</div>
            <div className="mb-case__section-label">{t('label_plea')}</div>
            <div className="mb-case__plea">{mugshot.charges.plea}</div>
          </div>
        </div>

        <div className="mb-case__charges">
          <div className="mb-case__charges-label">{t('label_charges')}</div>
          <div className="mb-case__headline">{mugshot.charges.headline}</div>
          <ol className="mb-case__supporting">
            {mugshot.charges.supporting.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ol>
        </div>

        <div className={`mb-case__verdict ${stamped ? 'is-stamped' : ''}`}>
          <StampBadge verdict={mugshot.verdict} />
        </div>

        <div className="mb-case__footer">
          <span>BOOKING OFFICER: ALG-04</span>
          <span>FILED: {mugshot.bookingDate}</span>
          <span>ALTERU.STUDIO</span>
        </div>
      </div>

      <div className="mb-case__actions">
        <button
          type="button"
          className="mb-btn mb-btn--secondary"
          onPointerDown={() => { playClick(); onWall(); }}
        >
          {t('cta_wall')}
        </button>
        {onShare ? (
          <button
            type="button"
            className="mb-btn mb-btn--secondary"
            disabled={shareDisabled}
            onPointerDown={() => { playClick(); onShare(); }}
          >
            {shareLabel || t('cta_share')}
          </button>
        ) : null}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-case__row">
      <span className="mb-case__row-label">{label}</span>
      <span className="mb-case__row-val">{value}</span>
    </div>
  );
}
