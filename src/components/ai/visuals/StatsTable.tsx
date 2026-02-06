'use client';

import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';
import type { VisualStatsTable } from '@/types/chat-visuals';

export function StatsTable({ table }: { table: VisualStatsTable }) {
  return (
    <div className="w-full my-4 bg-slate-900/80 rounded-xl border border-white/10 overflow-hidden">
      {/* Title */}
      <div className="px-4 py-3 bg-gradient-to-r from-orange-500/20 to-blue-500/20 border-b border-white/10">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-white">{table.title}</h3>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5">
              <th className="px-4 py-2 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                Stat
              </th>
              {table.headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-2 text-center text-xs font-medium text-white/60 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {table.rows.map((row, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white/80 font-medium">
                  {row.label}
                </td>
                {row.values.map((value, j) => {
                  const isHighlight = row.highlight === 'home' && j === 1 || row.highlight === 'away' && j === 0;
                  return (
                    <td
                      key={j}
                      className={cn(
                        "px-4 py-3 text-center tabular-nums",
                        isHighlight ? "text-green-400 font-bold" : "text-white"
                      )}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
