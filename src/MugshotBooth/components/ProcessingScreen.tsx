import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { playTypewriter } from '../utils/audio';
import type { Stage } from '../hooks/useMugshotGen';

interface Props {
  stage: Stage;
  caseNumber: string;
}

const TYPEWRITER_LINES = [
  'INTAKE FORM A — INITIATED',
  'SUBJECT: PENDING IDENTIFICATION',
  'BOOKING OFFICER: ALG-04',
  'INCIDENT: SEE ATTACHED',
  'STATEMENT: IT WASN\'T ME. IT WAS VIBES.',
  'PROCESSING…',
  'PHOTOGRAPHER: STANDBY',
  'FILM: HP5 PUSHED ONE STOP',
  'EVIDENCE BAG: SEALED',
  'CASE OFFICER: AWAITING SIGNATURE',
];

export default function ProcessingScreen({ stage, caseNumber }: Props) {
  // Typewriter effect: pop one character at a time across all lines.
  const [shown, setShown] = useState('');
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let chars = 0;
    let lines = 0;
    const start = Date.now();
    let last = start;
    const fullLines = [...TYPEWRITER_LINES];
    function tick() {
      if (cancelled) return;
      const now = Date.now();
      // Speed: ~22 chars/sec.
      const targetChars = Math.floor((now - start) / 45);
      while (chars < targetChars && lines < fullLines.length) {
        const line = fullLines[lines];
        const pos = chars - linesTotalUpTo(fullLines, lines);
        if (pos >= line.length) {
          lines++;
          chars++;
          // Newline consumes one char of "time".
        } else {
          chars++;
          // Clack on every 2-3rd character.
          if (now - last > 70 && Math.random() < 0.7) {
            playTypewriter();
            last = now;
          }
        }
      }
      setShown(
        fullLines
          .slice(0, lines + 1)
          .map((line, i) => {
            const before = linesTotalUpTo(fullLines, i);
            const visible = Math.min(line.length, chars - before);
            if (i < lines) return line;
            return line.slice(0, Math.max(0, visible));
          })
          .filter((s) => s.length > 0)
          .join('\n'),
      );
      setLineIdx(lines);
      if (lines < fullLines.length) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
  }, []);

  const stageLabel = (() => {
    switch (stage) {
      case 'uploading': return t('stage_uploading');
      case 'charges': return t('stage_charges');
      case 'booking': return t('stage_booking');
      case 'stamping': return t('stage_stamping');
      default: return t('stage_uploading');
    }
  })();

  // Progress bar: each stage advances ~25%.
  const progress = (() => {
    switch (stage) {
      case 'uploading': return 14;
      case 'charges':   return 35;
      case 'booking':   return 70;
      case 'stamping':  return 96;
      default:          return 8;
    }
  })();

  return (
    <div className="mb-processing">
      <div className="mb-processing__header">
        <div className="mb-processing__stamp">CASE FILE</div>
        <div className="mb-processing__case">{caseNumber}</div>
      </div>

      <div className="mb-processing__sheet">
        <pre className="mb-processing__type">{shown}<span className="mb-processing__caret">_</span></pre>
      </div>

      <div className="mb-processing__status">
        <div className="mb-processing__label">{stageLabel}</div>
        <div className="mb-processing__bar">
          <div
            className="mb-processing__bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mb-processing__line-count">
          {Math.min(lineIdx + 1, TYPEWRITER_LINES.length)}/{TYPEWRITER_LINES.length}
        </div>
      </div>
    </div>
  );
}

function linesTotalUpTo(lines: string[], idx: number): number {
  let total = 0;
  for (let i = 0; i < idx; i++) total += lines[i].length + 1; // +1 newline
  return total;
}
