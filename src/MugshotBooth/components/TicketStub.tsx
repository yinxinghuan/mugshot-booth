// Vertical rotated ticket-stub text on the left edge of a frame. Pure
// decoration — used on every screen to add the "paper artifact" character.

import type { CSSProperties, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  style?: CSSProperties;
}

export default function TicketStub({ children, style }: Props) {
  return (
    <div className="mb-stub" style={style} aria-hidden="true">
      {children}
    </div>
  );
}
