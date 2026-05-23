// Lightweight i18n — English primary, zh fallback. AlterU brand is
// English-first, so all marketing copy stays in English. Chinese strings
// exist only for the few UI labels that benefit from localization.

type Locale = 'en' | 'zh';

const dict: Record<Locale, Record<string, string>> = {
  en: {
    title: 'MUGSHOT BOOTH',
    subtitle: 'ALTERU PRECINCT — INTAKE',
    hint_tap_play: 'tap the camera to step in front of it',
    cta_upload: 'TAKE THE SHOT',
    cta_replace: 'choose a different shot',
    cta_book: 'BOOK SUSPECT',
    cta_new: 'NEW BOOKING',
    cta_wall: "ROGUE'S GALLERY",
    cta_back: 'back to case file',
    cta_share: 'SHARE TO AIGRAM',
    cta_share_done: 'COPIED ✓',
    stage_uploading: 'developing photograph…',
    stage_charges: 'compiling charges…',
    stage_booking: 'booking suspect…',
    stage_stamping: 'stamping case file…',
    label_case: 'CASE NO.',
    label_date: 'BOOKING DATE',
    label_height: 'HEIGHT',
    label_eyes: 'EYES',
    label_precinct: 'PRECINCT',
    label_marks: 'DISTINGUISHING MARKS',
    label_plea: "SUSPECT'S STATEMENT",
    label_charges: 'CHARGES',
    wall_title: "ROGUE'S GALLERY",
    wall_empty: 'no other suspects booked yet — be the first.',
    booth_camera_caption: 'STAND ON THE MARK',
    booth_camera_subcaption: 'TAP TO BEGIN BOOKING',
    verdict_guilty: 'GUILTY',
    verdict_awaiting: 'AWAITING TRIAL',
    verdict_bail: 'FREED ON BAIL',
    err_upload: "couldn't develop that photograph — try another",
    err_processing: 'booking failed — please return to the holding cell',
  },
  zh: {
    title: '档案室',
    subtitle: 'ALTERU 警局 · 收押处',
    hint_tap_play: '点相机走到镜头前',
    cta_upload: '走到镜头前',
    cta_replace: '换张照片',
    cta_book: '收押',
    cta_new: '下一位嫌疑人',
    cta_wall: '通缉墙',
    cta_back: '返回案宗',
    cta_share: '分享到 AIGRAM',
    cta_share_done: '已复制 ✓',
    stage_uploading: '冲洗照片…',
    stage_charges: '罗列罪名…',
    stage_booking: '收押中…',
    stage_stamping: '盖章中…',
    label_case: '案件编号',
    label_date: '收押日期',
    label_height: '身高',
    label_eyes: '瞳色',
    label_precinct: '辖区',
    label_marks: '特征记录',
    label_plea: '嫌疑人陈述',
    label_charges: '罪名',
    wall_title: '通缉墙',
    wall_empty: '还没有别的嫌疑人——你是第一位。',
    booth_camera_caption: '站到标记上',
    booth_camera_subcaption: '点击开始收押',
    verdict_guilty: '判定有罪',
    verdict_awaiting: '候审',
    verdict_bail: '保释中',
    err_upload: '照片冲洗失败——请换一张',
    err_processing: '收押失败——请返回收押室',
  },
};

function detectLocale(): Locale {
  // English-first by brand rule. zh only via explicit localStorage override.
  if (typeof window === 'undefined') return 'en';
  try {
    const override = localStorage.getItem('mugshot_locale');
    if (override === 'en' || override === 'zh') return override;
  } catch { /* private mode */ }
  return 'en';
}

const locale: Locale = detectLocale();

export function t(key: string, vars?: Record<string, string | number>): string {
  const table = dict[locale] || dict.en;
  let s = table[key] ?? dict.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(`{${k}}`, String(v));
    }
  }
  return s;
}

export function currentLocale(): Locale {
  return locale;
}
