'use client';

export function StatBox({
  label,
  value,
  subtext,
  highlight = false,
  negative = false
}: {
  label: string;
  value: string;
  subtext?: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2 text-center">
      <p className="text-[10px] text-white/40 uppercase">{label}</p>
      <p className={`text-sm font-semibold ${
        negative ? 'text-red-400' : highlight ? 'text-yellow-400' : 'text-white'
      }`}>
        {value}
      </p>
      {subtext && <p className="text-[10px] text-white/30">{subtext}</p>}
    </div>
  );
}
