import { t } from '../i18n';

interface Props {
  verdict: 'GUILTY' | 'AWAITING TRIAL' | 'FREED ON BAIL';
}

export default function StampBadge({ verdict }: Props) {
  const label = (() => {
    switch (verdict) {
      case 'GUILTY': return t('verdict_guilty');
      case 'AWAITING TRIAL': return t('verdict_awaiting');
      case 'FREED ON BAIL': return t('verdict_bail');
    }
  })();
  const color = verdict === 'GUILTY' ? '#a02617' : verdict === 'AWAITING TRIAL' ? '#7a4d18' : '#2a5a3a';

  return (
    <div className="mb-stamp" style={{ color, borderColor: color }}>
      <div className="mb-stamp__ring" style={{ borderColor: color }}>
        <div className="mb-stamp__text">{label}</div>
        <div className="mb-stamp__sub">ALTERU PD</div>
      </div>
    </div>
  );
}
