// The mono case-meta strip at the top of every screen. Three columns,
// underlined in cobalt blue.

interface Props {
  left: string;
  center: string;
  right: string;
}

export default function MetaStrip({ left, center, right }: Props) {
  return (
    <div className="mb-meta-strip" aria-hidden="true">
      <span>{left}</span>
      <span className="mb-meta-strip__center">{center}</span>
      <span>{right}</span>
    </div>
  );
}
