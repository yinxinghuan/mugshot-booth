import { useRef, useState } from 'react';
import { t } from '../i18n';
import { previewURL } from '../utils/selfie';
import { playClick } from '../utils/audio';
import HeightRuler from './HeightRuler';

interface Props {
  onSubmit: (file: File) => void;
  onWall: () => void;
  booked: number;
  hasFirstTouched: boolean;
  errorLabel?: string;
}

export default function BoothScreen({
  onSubmit,
  onWall,
  booked,
  hasFirstTouched,
  errorLabel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; file: File } | null>(null);

  const openPicker = () => {
    playClick();
    inputRef.current?.click();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Object URL revoked on next pick / submit.
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview({ url: previewURL(file), file });
    // Allow re-picking the same file by clearing the input value.
    e.target.value = '';
  };

  const handleBook = () => {
    if (!preview) return;
    playClick();
    onSubmit(preview.file);
  };

  const handleReplace = () => {
    playClick();
    inputRef.current?.click();
  };

  return (
    <div className="mb-booth">
      <div className="mb-booth__wall">
        <HeightRuler />
      </div>

      <div className="mb-booth__viewfinder">
        {preview ? (
          <img
            className="mb-booth__preview"
            src={preview.url}
            alt="selfie preview"
            draggable={false}
          />
        ) : (
          <div className="mb-booth__placeholder">
            <CameraIcon />
            <div className="mb-booth__caption">{t('booth_camera_caption')}</div>
            <div className="mb-booth__subcaption">{t('booth_camera_subcaption')}</div>
          </div>
        )}
        <div className="mb-booth__reticle" />
        <div className="mb-booth__corners">
          <span /><span /><span /><span />
        </div>
      </div>

      <div className="mb-booth__sheet">
        <div className="mb-booth__sheet-title">
          ALTERU POLICE DEPARTMENT — INTAKE FORM
        </div>
        <div className="mb-booth__sheet-row">
          <span>BOOKINGS THIS SESSION</span>
          <span className="mb-booth__sheet-val">{String(booked).padStart(4, '0')}</span>
        </div>
        <div className="mb-booth__sheet-row">
          <span>STATUS</span>
          <span className="mb-booth__sheet-val">
            {preview ? 'AWAITING BOOK' : 'AWAITING SUSPECT'}
          </span>
        </div>
        {errorLabel ? (
          <div className="mb-booth__sheet-error">{errorLabel}</div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: 'none' }}
        onChange={onFile}
      />

      <div className="mb-booth__actions">
        {preview ? (
          <>
            <button
              type="button"
              className="mb-btn mb-btn--secondary"
              onPointerDown={handleReplace}
            >
              {t('cta_replace')}
            </button>
            <button
              type="button"
              className="mb-btn mb-btn--primary"
              onPointerDown={handleBook}
            >
              {t('cta_book')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="mb-btn mb-btn--secondary"
              onPointerDown={() => { playClick(); onWall(); }}
            >
              {t('cta_wall')}
            </button>
            <button
              type="button"
              className={`mb-btn mb-btn--primary ${!hasFirstTouched ? 'mb-btn--pulse' : ''}`}
              onPointerDown={openPicker}
            >
              {t('cta_upload')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 96 96" className="mb-booth__cam">
      {/* Old-school SLR silhouette */}
      <rect x="8" y="26" width="80" height="56" rx="3" fill="#0a0908" stroke="#0a0908" />
      <rect x="28" y="18" width="40" height="12" rx="2" fill="#0a0908" />
      <circle cx="48" cy="54" r="20" fill="#1a1612" stroke="#2a241e" strokeWidth="2" />
      <circle cx="48" cy="54" r="14" fill="#0a0908" />
      <circle cx="48" cy="54" r="8" fill="#3a3128" />
      <circle cx="42" cy="50" r="3" fill="#9b8b6f" />
      <rect x="72" y="32" width="10" height="6" rx="1" fill="#bf3a2a" />
      <rect x="14" y="32" width="8" height="4" rx="1" fill="#3a3128" />
    </svg>
  );
}
