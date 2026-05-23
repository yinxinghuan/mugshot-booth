// Processing screen — stamp-slam edition.
// Big "CASE BOOKING" through the red ring. Below: a torn legal-pad sheet
// where stamps slam down one at a time as backend stages complete.

import { useEffect, useMemo, useState } from 'react';
import MetaStrip from './MetaStrip';
import TicketStub from './TicketStub';
import Residue from './Residue';
import RedRingWash from './RedRingWash';
import { t } from '../i18n';
import { playStamp } from '../utils/audio';
import type { Stage } from '../hooks/useMugshotGen';

interface Props {
  stage: Stage;
  caseNumber: string;
}

// Map backend stages to the sequential index of stamps that have landed.
function stageToStep(stage: Stage): number {
  switch (stage) {
    case 'uploading': return 1;  // photo developed
    case 'charges':   return 2;  // fingerprints rolled (charges starting)
    case 'booking':   return 4;  // charges + statement done
    case 'stamping':  return 5;  // GUILTY stamp lands
    default:          return 0;
  }
}

const STAMPS = [
  { label: 'PHOTOGRAPHED',    top: 60,  left: 24,    right: undefined, rot: -10, color: 'red'  },
  { label: 'FINGERPRINTED',   top: 92,  left: undefined, right: 18,    rot:  7,  color: 'blue' },
  { label: 'CHARGES COMPILED', top: 144, left: 36,   right: undefined, rot: -6,  color: 'red'  },
  { label: 'STATEMENT TAKEN', top: 196, left: undefined, right: 32,    rot:  9,  color: 'blue' },
] as const;

export default function ProcessingScreen({ stage, caseNumber }: Props) {
  const step = stageToStep(stage);

  // Random sheet tilt per session — fresh page of paper every time.
  const tilt = useMemo(() => (Math.random() * 6 - 3).toFixed(2) + 'deg', []);

  // Play a stamp sound each time a new stamp lands.
  const [prevStep, setPrevStep] = useState(0);
  useEffect(() => {
    if (step > prevStep) {
      playStamp();
      setPrevStep(step);
    }
  }, [step, prevStep]);

  return (
    <>
      <Residue />
      <div className="mb-dash mb-dash--tl" aria-hidden="true">– – – –</div>
      <div className="mb-dash mb-dash--tr" aria-hidden="true">– – – –</div>

      <MetaStrip left="ALTERU PD" center={`PROCESSING · ${todayShort()}`} right={shortCase(caseNumber)} />
      <TicketStub>INTAKE FORM A · SUSPECT IN HOLDING · DO NOT LEAVE SEAT</TicketStub>

      <RedRingWash style={{ position: 'absolute', top: 30 }} />

      <div className="mb-proc__head">
        <div className="mb-proc__head__l1">CASE</div>
        <div className="mb-proc__head__l2">BOOKING</div>
        <span className="mb-proc__head__sub">CASE OFFICER ALG-04 ON THE LINE</span>
      </div>

      <div
        className="mb-proc__sheet"
        style={{ '--mb-sheet-tilt': tilt } as React.CSSProperties}
      >
        <div className="mb-proc__sheet-label">INTAKE FORM A · {todayShort()}</div>
        <div className="mb-proc__sheet-no">{shortCase(caseNumber)}</div>

        {STAMPS.map((s, i) => {
          if (i + 1 > step) return null;
          const posStyle: React.CSSProperties = {
            top: s.top,
            ...(s.left !== undefined ? { left: s.left } : {}),
            ...(s.right !== undefined ? { right: s.right } : {}),
            ['--mb-slam-rot' as string]: `${s.rot}deg`,
            animationDelay: `${i * 0.05}s`,
          };
          return (
            <div
              key={s.label}
              className={`mb-proc__slam mb-proc__slam--small ${s.color === 'blue' ? 'is-blue' : ''}`}
              style={posStyle}
            >
              {s.label}
            </div>
          );
        })}

        {step >= 5 && (
          <div
            className="mb-proc__slam mb-proc__slam--big"
            style={{
              top: 244,
              left: 86,
              ['--mb-slam-rot' as string]: '-12deg',
            } as React.CSSProperties}
          >
            <div className="mb-proc__slam__big">{t('verdict_guilty')}</div>
            <div className="mb-proc__slam__sub">ALTERU PD</div>
          </div>
        )}
      </div>

      <div className="mb-proc__progress">
        <span>{t('proc_status')}</span>
        <div className="mb-proc__dots">
          {[1,2,3,4,5].map(i => (
            <div
              key={i}
              className={
                i < step ? 'mb-proc__dot is-done' :
                i === step ? 'mb-proc__dot is-current' : 'mb-proc__dot'
              }
            />
          ))}
        </div>
        <span>{step >= 5 ? t('proc_almost') : '~ 1m 24s'}</span>
      </div>

      <div className="mb-proc__hint">
        {t('proc_hint')}
      </div>
    </>
  );
}

function todayShort(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}

function shortCase(caseNumber: string): string {
  // ALT-2026-00042 → NO. 042
  const m = caseNumber.match(/-(\d+)$/);
  if (!m) return caseNumber;
  return `NO. ${m[1].slice(-3)}`;
}
