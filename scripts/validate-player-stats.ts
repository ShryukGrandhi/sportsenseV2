// Quick validation script for ESPN boxscore label mapping
// Run with: npx tsx scripts/validate-player-stats.ts

import fs from 'fs';
import path from 'path';

type Fixture = {
  labels: string[];
  players: Array<{
    athlete?: { displayName?: string };
    stats: string[];
  }>;
};

const fixturePath = path.join(__dirname, 'fixtures', 'espn-boxscore-player-stats.json');
const raw = fs.readFileSync(fixturePath, 'utf-8');
const fixture = JSON.parse(raw) as Fixture;

const labels = fixture.labels.map((label) => label.toLowerCase().trim());
const player = fixture.players[0];

const getStatByLabel = (label: string, defaultVal = '0') => {
  const idx = labels.indexOf(label.toLowerCase().trim());
  if (idx === -1 || idx >= player.stats.length) return defaultVal;
  return String(player.stats[idx] ?? defaultVal);
};

const parseShooting = (str: string): [number, number] => {
  if (!str || str === '--' || str === '-') return [0, 0];
  const parts = str.split('-');
  return [parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0];
};

const [fg3m, fg3a] = parseShooting(getStatByLabel('3pt'));
const plusMinus = getStatByLabel('+/-');
const points = parseInt(getStatByLabel('pts'), 10) || 0;

console.log('[Fixture] Player:', player.athlete?.displayName || 'Unknown');
console.log('[Fixture] 3PT:', `${fg3m}-${fg3a}`);
console.log('[Fixture] +/-:', plusMinus);
console.log('[Fixture] PTS:', points);
