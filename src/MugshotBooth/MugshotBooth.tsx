import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameSave } from '@shared/save';
import { isInAigram } from '@shared/runtime';
import SvgFilters from './components/SvgFilters';
import BoothScreen from './components/BoothScreen';
import ProcessingScreen from './components/ProcessingScreen';
import CaseFile from './components/CaseFile';
import Gallery from './components/Gallery';
import { useMugshotGen } from './hooks/useMugshotGen';
import { useGallery } from './hooks/useGallery';
import { caseNumber, prependMugshot } from './utils/booking';
import { startAmbient, stopAmbient, playClick } from './utils/audio';
import { t } from './i18n';
import type { Mugshot, MugshotSave, Phase, WallEntry } from './types';
import './MugshotBooth.less';

const DEMO_PHOTO = '/mugshot-booth/demo_mugshot2.jpg';
const DEMO_SELFIE = '/mugshot-booth/demo_mugshot2.jpg';

const DEMO_MUGSHOT: Mugshot = {
  id: 'demo',
  imageUrl: DEMO_PHOTO,
  selfieUrl: DEMO_SELFIE,
  charges: {
    headline: 'LOITERING WITH INTENT TO VIBE',
    supporting: [
      'Possession of unsent texts after midnight',
      'Failure to maintain eye contact during obligation',
      'Disorderly hope in the first degree',
    ],
    distinguishingMarks:
      'Faint scar above left eyebrow; carries the posture of someone who reads their own horoscope.',
    plea: '"It wasn\'t me. It was vibes."',
  },
  caseNumber: 'ALT-2026-00042',
  bookingDate: '2026-05-23',
  height: "5'09\" (when asked)",
  eyeColor: 'wifi-bar grey',
  precinct: 'PRECINCT 17: SLOW SIDE',
  verdict: 'GUILTY',
  createdAt: Date.now(),
};

const DEMO_WALL: Array<{ name: string; mugshot: Mugshot }> = [
  { name: 'jenny',  mugshot: { ...DEMO_MUGSHOT, id: 'a', caseNumber: 'ALT-2026-00041', charges: { ...DEMO_MUGSHOT.charges, headline: 'PUBLIC CRYING WITHOUT PERMIT' } } },
  { name: 'algram', mugshot: { ...DEMO_MUGSHOT, id: 'b', caseNumber: 'ALT-2026-00040', charges: { ...DEMO_MUGSHOT.charges, headline: 'GRAND THEFT EMOTIONAL' } } },
  { name: 'jm·f',   mugshot: { ...DEMO_MUGSHOT, id: 'c', caseNumber: 'ALT-2026-00039', charges: { ...DEMO_MUGSHOT.charges, headline: 'TRESPASSING IN THE PAST TENSE' } } },
  { name: 'isaya',  mugshot: { ...DEMO_MUGSHOT, id: 'd', caseNumber: 'ALT-2026-00038', charges: { ...DEMO_MUGSHOT.charges, headline: 'OPERATING A PERSONALITY UNDER THE INFLUENCE' } } },
  { name: 'isabel', mugshot: { ...DEMO_MUGSHOT, id: 'e', caseNumber: 'ALT-2026-00037', charges: { ...DEMO_MUGSHOT.charges, headline: 'AGGRAVATED OVERTHINKING' } } },
  { name: 'ghost',  mugshot: { ...DEMO_MUGSHOT, id: 'f', caseNumber: 'ALT-2026-00036', charges: { ...DEMO_MUGSHOT.charges, headline: 'POSSESSION OF UNSENT TEXTS' } } },
];

export default function MugshotBooth() {
  const demo = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('demo');
  }, []);

  const { savedData, persist } = useGameSave<MugshotSave>('mugshot-booth');
  const mugGen = useMugshotGen();
  const gallery = useGallery();

  const [phase, setPhase] = useState<Phase>('booth');
  const [current, setCurrent] = useState<Mugshot | null>(null);
  const [pendingCase, setPendingCase] = useState<string | null>(null);
  const [shareLabel, setShareLabel] = useState<string>('');
  const [errorLabel, setErrorLabel] = useState<string>('');
  const [hasFirstTouched, setHasFirstTouched] = useState(false);
  const [cameFromWall, setCameFromWall] = useState(false);

  // ─── Demo overrides ──────────────────────────────────────────
  useEffect(() => {
    if (!demo) return;
    if (demo === 'booth') setPhase('booth');
    else if (demo === 'processing' || demo === 'loading') {
      setPendingCase('ALT-2026-00042');
      setPhase('processing');
    } else if (demo === 'result' || demo === 'poster') {
      setCurrent(DEMO_MUGSHOT);
      setPhase('result');
    } else if (demo === 'wall') {
      setPhase('wall');
    }
  }, [demo]);

  // First-touch unlock
  const firstTouchRef = useRef(false);
  useEffect(() => {
    function onPointer() {
      if (firstTouchRef.current) return;
      firstTouchRef.current = true;
      setHasFirstTouched(true);
      startAmbient();
    }
    window.addEventListener('pointerdown', onPointer, { once: true });
    return () => window.removeEventListener('pointerdown', onPointer);
  }, []);

  useEffect(() => {
    if (phase === 'result') {
      stopAmbient();
    } else if (hasFirstTouched) {
      startAmbient();
    }
  }, [phase, hasFirstTouched]);

  // Local mirror — useGameSave.savedData does NOT update after persist(),
  // so reading `savedData?.mugshots` on the SECOND publish sees stale
  // (pre-first-publish) data → prependMugshot(null, m2) → persist
  // overwrites the first mugshot. Seed mirror ONCE from savedData on
  // first load and treat it as the source of truth.
  // See feedback_useGameSave_local_mirror.md.
  const [mirror, setMirror] = useState<MugshotSave | undefined>(undefined);
  useEffect(() => {
    if (mirror === undefined && savedData !== undefined) {
      setMirror(savedData ?? { mugshots: [] });
    }
  }, [savedData, mirror]);

  const ownMugshots: Mugshot[] = mirror?.mugshots ?? [];
  const bookedCount = ownMugshots.length;

  const handleSelfieSubmit = async (file: File) => {
    const caseNo = caseNumber(bookedCount);
    setPendingCase(caseNo);
    setErrorLabel('');
    setPhase('processing');
    try {
      const m = await mugGen.generate({ selfie: file, caseNumber: caseNo });
      setCurrent(m);
      setPhase('result');
      const nextSave: MugshotSave = {
        mugshots: prependMugshot(mirror?.mugshots, m),
      };
      setMirror(nextSave);
      persist(nextSave);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorLabel(`${t('err_processing')} (${msg.slice(0, 100)})`);
      setPhase('booth');
    } finally {
      setPendingCase(null);
    }
  };

  const handleNew = () => {
    playClick();
    setShareLabel('');
    setCameFromWall(false);
    setPhase('booth');
  };
  const handleWall = () => {
    playClick();
    gallery.refresh();
    setPhase('wall');
  };
  const handleBackFromWall = () => {
    playClick();
    setPhase(current ? 'result' : 'booth');
  };
  const handleViewFromWall = (entry: WallEntry) => {
    playClick();
    setCurrent(entry.mugshot);
    setCameFromWall(true);
    setPhase('result');
  };
  const handleShare = () => {
    if (!current) return;
    const text = `${current.charges.headline} — case ${current.caseNumber} · alteru.studio/mugshot-booth`;
    try { navigator.clipboard?.writeText(text); } catch { /* ignore */ }
    setShareLabel(t('cta_share_done'));
    setTimeout(() => setShareLabel(''), 1600);
  };

  const wallEntries: WallEntry[] =
    demo === 'wall' || demo === 'poster'
      ? DEMO_WALL.map((d, i) => ({
          userId: `demo-${i}`,
          userName: d.name,
          userAvatarUrl: undefined,
          mugshot: d.mugshot,
        }))
      : gallery.entries;
  const wallLoaded = demo === 'wall' || demo === 'poster' ? true : gallery.loaded;

  return (
    <div className="mb-root">
      <SvgFilters />
      {phase === 'booth' && (
        <BoothScreen
          onSubmit={handleSelfieSubmit}
          onWall={handleWall}
          booked={bookedCount}
          hasFirstTouched={hasFirstTouched}
          errorLabel={errorLabel}
        />
      )}
      {phase === 'processing' && pendingCase && (
        <ProcessingScreen stage={mugGen.stage} caseNumber={pendingCase} />
      )}
      {phase === 'result' && current && (
        <CaseFile
          mugshot={current}
          viewMode={cameFromWall ? 'gallery' : 'booking'}
          onNew={handleNew}
          onWall={handleWall}
          onShare={isInAigram ? undefined : handleShare}
          shareLabel={shareLabel || undefined}
          shareDisabled={!!shareLabel}
        />
      )}
      {phase === 'wall' && (
        <Gallery
          community={wallEntries}
          mine={ownMugshots}
          loaded={wallLoaded}
          onBack={handleBackFromWall}
          onView={handleViewFromWall}
          onNew={handleNew}
        />
      )}
      {/* Bottom-corner hint removed — the chunky 'TAKE THE SHOT' CTA is
          self-evident, and the hint was overlapping the booking count. */}
    </div>
  );
}
