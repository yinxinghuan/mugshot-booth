// Vintage SLR camera icon — used in the booth placeholder when no
// selfie has been picked yet. Render as an SVG with the stamp-rough
// filter applied so it reads as printed.

export default function CameraIcon() {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      style={{ width: '100%', height: '100%', filter: 'url(#mb-stamp-rough)' }}
      aria-hidden="true"
    >
      <rect x="32" y="20" width="36" height="12" />
      <rect x="10" y="30" width="80" height="56" rx="3" />
      <circle cx="50" cy="58" r="20" fill="#efe4c8" />
      <circle cx="50" cy="58" r="13" />
      <circle cx="50" cy="58" r="7" fill="#efe4c8" />
      <rect x="72" y="34" width="10" height="6" fill="#e6311d" />
      <rect x="16" y="34" width="9" height="5" fill="#efe4c8" />
    </svg>
  );
}
