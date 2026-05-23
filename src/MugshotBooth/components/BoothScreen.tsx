// Booth screen — landing.
// Hero "STEP UP, SUSPECT" passes through the red ring wash. The camera
// icon (or selfie preview) sits in the lower half of the ring. Three
// actions: TAKE THE SHOT (camera capture), UPLOAD PHOTO (gallery), VIEW
// GALLERY (other suspects).

import { useRef, useState } from 'react';
import HalftonePhoto from './HalftonePhoto';
import RedRingWash from './RedRingWash';
import MetaStrip from './MetaStrip';
import TicketStub from './TicketStub';
import Residue from './Residue';
import { t } from '../i18n';
import { previewURL } from '../utils/selfie';
import { playClick, playShutter } from '../utils/audio';

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
  const cameraInput = useRef<HTMLInputElement>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; file: File } | null>(null);

  const openCamera = () => { playClick(); cameraInput.current?.click(); };
  const openLibrary = () => { playClick(); uploadInput.current?.click(); };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview({ url: previewURL(file), file });
    e.target.value = '';
  };

  const handleBook = () => {
    if (!preview) return;
    playShutter();
    onSubmit(preview.file);
  };

  return (
    <>
      <Residue />
      <div className="mb-dash mb-dash--tl" aria-hidden="true">– – – –</div>
      <div className="mb-dash mb-dash--tr" aria-hidden="true">– – – –</div>
      <div className="mb-dash mb-dash--ml" aria-hidden="true">– – – –</div>
      <div className="mb-dash mb-dash--mr" aria-hidden="true">– – – –</div>

      <MetaStrip left="ALTERU PD" center="BOOKING · INTAKE" right="VICE SQUAD" />
      <TicketStub>PRECINCT 17 · INTAKE · WALK-INS WELCOME · OFFICER ALG-04</TicketStub>

      <RedRingWash style={{ position: 'absolute', top: 60 }} />

      <div className="mb-booth__head">
        <div className="mb-booth__head__l1">STEP UP,</div>
        <div className="mb-booth__head__l2">SUSPECT</div>
      </div>

      {preview ? (
        <div className="mb-booth__preview">
          <HalftonePhoto src={preview.url} width={260} height={325} cell={2.4} />
        </div>
      ) : (
        <div className="mb-booth__camera">
          <HalftonePhoto
            src="/mugshot-booth/demo_camera.jpg"
            width={260}
            height={316}
            cell={2.4}
          />
        </div>
      )}

      <div className="mb-booth__floor">
        {preview ? 'PHOTO ON FILE' : t('booth_camera_caption')}
        <span className="mb-booth__floor__small">
          {preview ? 'press BOOK SUSPECT to file the case' : t('booth_camera_subcaption')}
        </span>
      </div>

      {errorLabel ? <div className="mb-booth__error">{errorLabel}</div> : null}

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: 'none' }}
        onChange={onFile}
      />
      <input
        ref={uploadInput}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFile}
      />

      <div className="mb-actions-stack">
        {preview ? (
          <>
            <button
              type="button"
              className={`mb-chip mb-chip--primary ${!hasFirstTouched ? '' : ''}`}
              onPointerDown={handleBook}
            >
              {t('cta_book')}
            </button>
            <div className="mb-actions-stack__row">
              <button
                type="button"
                className="mb-chip mb-chip--secondary mb-chip--small"
                onPointerDown={() => { playClick(); openLibrary(); }}
              >
                {t('cta_replace')}
              </button>
              <button
                type="button"
                className="mb-chip mb-chip--ghost mb-chip--small"
                onPointerDown={() => { playClick(); onWall(); }}
              >
                {t('cta_wall')}
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className="mb-chip mb-chip--primary"
              onPointerDown={openCamera}
            >
              {t('cta_take')}
            </button>
            <div className="mb-actions-stack__row">
              <button
                type="button"
                className="mb-chip mb-chip--secondary mb-chip--small"
                onPointerDown={openLibrary}
              >
                {t('cta_upload')}
              </button>
              <button
                type="button"
                className="mb-chip mb-chip--ghost mb-chip--small"
                onPointerDown={() => { playClick(); onWall(); }}
              >
                {t('cta_wall')}
              </button>
            </div>
          </>
        )}
        <div className="mb-booth-count">
          <b>{String(booked).padStart(3, '0')}</b> SUSPECTS BOOKED THIS WEEK
        </div>
      </div>
    </>
  );
}
