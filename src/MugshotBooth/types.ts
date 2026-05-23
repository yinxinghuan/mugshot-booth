// Mugshot Booth — data shapes for the booking flow.

export type Phase = 'booth' | 'processing' | 'result' | 'wall';

export interface Charges {
  /** Single headline charge, all caps, e.g. "LOITERING WITH INTENT TO VIBE". */
  headline: string;
  /** 2-3 supplementary counts. */
  supporting: string[];
  /** One-sentence distinguishing-marks blurb for the case file. */
  distinguishingMarks: string;
  /** One-sentence "subject's plea / statement". */
  plea: string;
}

export interface Mugshot {
  id: string;
  /** Public R2 URL of the AI-generated mugshot photo (B&W noir). */
  imageUrl: string;
  /** Original selfie URL, kept for re-rolls / debug. */
  selfieUrl: string;
  charges: Charges;
  /** Sequential case # for this user, formatted "ALT-2026-00042". */
  caseNumber: string;
  /** Booking date stamp, "2026-05-23" format. */
  bookingDate: string;
  /** Random ridiculous height, "5'09\"". */
  height: string;
  /** Random eye color (always implausible). */
  eyeColor: string;
  /** Random precinct of arrest. */
  precinct: string;
  /** GUILTY / AWAITING TRIAL / FREED ON BAIL — for the corner stamp. */
  verdict: 'GUILTY' | 'AWAITING TRIAL' | 'FREED ON BAIL';
  createdAt: number;
}

export interface MugshotSave {
  /** Most recent at index 0. */
  mugshots: Mugshot[];
  _lastActive?: number;
}

export interface WallEntry {
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
  mugshot: Mugshot;
}
