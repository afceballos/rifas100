import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function TicketQRCode({ value, size = 200 }) {
  const [svg, setSvg] = useState('');

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, { type: 'svg', margin: 1, color: { dark: '#18181b', light: '#ffffff' } })
      .then(str => { if (!cancelled) setSvg(str); })
      .catch(() => { if (!cancelled) setSvg(''); });
    return () => { cancelled = true; };
  }, [value]);

  return (
    <div
      style={{ width: size, height: size }}
      className="[&>svg]:w-full [&>svg]:h-full"
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
