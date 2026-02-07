'use client';

import Image from 'next/image';

interface TeamLogoProps {
  abbreviation: string;
  alt?: string;
  name?: string;
  size?: number;
  className?: string;
}

export function TeamLogo({ abbreviation, alt, name, size = 40, className = 'object-contain' }: TeamLogoProps) {
  const imgAlt = alt || name || '';
  return (
    <Image
      src={`https://a.espncdn.com/i/teamlogos/nba/500/${abbreviation.toLowerCase()}.png`}
      alt={imgAlt}
      width={size}
      height={size}
      className={className}
      unoptimized
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}
