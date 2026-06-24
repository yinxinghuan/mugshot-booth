// Lightweight i18n — English primary (brand rule), zh fallback for the
// few labels that benefit from localization.

type Locale = 'en' | 'zh';

const dict: Record<Locale, Record<string, string>> = {
  en: {
    // Booth screen
    booth_camera_caption: 'STAND ON THE MARK',
    booth_camera_subcaption: "we'll print your face on file",
    hint_tap_play: 'tap take-the-shot to begin booking',

    // CTAs
    cta_take: 'TAKE THE SHOT',
    cta_upload: 'UPLOAD PHOTO',
    cta_book: 'BOOK SUSPECT',
    cta_replace: 'REPLACE',
    cta_wall: "ROGUE'S GALLERY",
    cta_wall_short: 'GALLERY',
    cta_new: 'NEW BOOKING',
    cta_back: 'BACK',
    cta_share: 'SHARE TO AIGRAM',
    cta_share_done: 'COPIED ✓',

    // Processing stages
    proc_status: 'BOOKING',
    proc_almost: 'ALMOST',
    proc_hint: "stay in your seat. don't make eye contact.",

    // Result / case file
    label_charges_further: 'FURTHER CHARGES',
    label_marks: 'DISTINGUISHING MARKS',
    label_plea: "SUSPECT'S STATEMENT",
    verdict_guilty: 'GUILTY',
    verdict_awaiting: 'AWAITING',
    verdict_bail: 'BAIL',
    verdict_guilty_short: 'GUILTY',

    // Gallery
    wall_title: "ROGUE'S GALLERY",
    wall_empty: 'no other suspects booked yet — be the first.',

    // Guestbook (notes left on a mugshot's case file)
    notes_title: 'NOTES ON FILE',
    notes_cta: 'NOTES',
    notes_empty: 'no notes on this file yet — leave the first.',
    notes_signedout: 'open in aigram to leave a note',
    notes_placeholder: 'leave a note…',
    notes_send: 'SEND',
    notes_you: 'you',
    notes_someone: 'someone',

    // Errors
    err_upload: "couldn't develop that photograph — try another",
    err_processing: 'booking failed — please return to the holding cell',
  },
  zh: {
    booth_camera_caption: '站到标记上',
    booth_camera_subcaption: '我们要把你的脸印进档案',
    hint_tap_play: '点 TAKE THE SHOT 开始收押',

    cta_take: '拍 一 张',
    cta_upload: '从相册选',
    cta_book: '收押',
    cta_replace: '换一张',
    cta_wall: '通缉墙',
    cta_wall_short: '通缉墙',
    cta_new: '下一位嫌疑人',
    cta_back: '返回',
    cta_share: '分享到 AIGRAM',
    cta_share_done: '已复制 ✓',

    proc_status: '收押中',
    proc_almost: '快好了',
    proc_hint: '坐好。不要四处张望。',

    label_charges_further: '其他罪名',
    label_marks: '特征记录',
    label_plea: '嫌疑人陈述',
    verdict_guilty: '有罪',
    verdict_awaiting: '候审',
    verdict_bail: '保释',
    verdict_guilty_short: '有罪',

    wall_title: '通缉墙',
    wall_empty: '还没有别的嫌疑人，你是第一位。',

    notes_title: '档案留言',
    notes_cta: '留言',
    notes_empty: '还没有人留言 —— 来当第一个。',
    notes_signedout: '在 aigram 中打开即可留言',
    notes_placeholder: '写句留言…',
    notes_send: '发送',
    notes_you: '你',
    notes_someone: '某人',

    err_upload: '照片冲洗失败，换一张试试',
    err_processing: '收押失败，请回到收押室',
  },
};

function detectLocale(): Locale {
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
