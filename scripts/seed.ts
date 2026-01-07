// Enhanced Seed Script - Populates database with NBA data and sample games

import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All 30 NBA teams with ESPN-compatible IDs
const NBA_TEAMS = [
  { id: 1, abbr: 'ATL', name: 'Hawks', fullName: 'Atlanta Hawks', city: 'Atlanta', conference: 'East', division: 'Southeast', primary: '#E03A3E', secondary: '#C1D32F' },
  { id: 2, abbr: 'BOS', name: 'Celtics', fullName: 'Boston Celtics', city: 'Boston', conference: 'East', division: 'Atlantic', primary: '#007A33', secondary: '#BA9653' },
  { id: 17, abbr: 'BKN', name: 'Nets', fullName: 'Brooklyn Nets', city: 'Brooklyn', conference: 'East', division: 'Atlantic', primary: '#000000', secondary: '#FFFFFF' },
  { id: 30, abbr: 'CHA', name: 'Hornets', fullName: 'Charlotte Hornets', city: 'Charlotte', conference: 'East', division: 'Southeast', primary: '#1D1160', secondary: '#00788C' },
  { id: 4, abbr: 'CHI', name: 'Bulls', fullName: 'Chicago Bulls', city: 'Chicago', conference: 'East', division: 'Central', primary: '#CE1141', secondary: '#000000' },
  { id: 5, abbr: 'CLE', name: 'Cavaliers', fullName: 'Cleveland Cavaliers', city: 'Cleveland', conference: 'East', division: 'Central', primary: '#860038', secondary: '#FDBB30' },
  { id: 6, abbr: 'DAL', name: 'Mavericks', fullName: 'Dallas Mavericks', city: 'Dallas', conference: 'West', division: 'Southwest', primary: '#00538C', secondary: '#002B5E' },
  { id: 7, abbr: 'DEN', name: 'Nuggets', fullName: 'Denver Nuggets', city: 'Denver', conference: 'West', division: 'Northwest', primary: '#0E2240', secondary: '#FEC524' },
  { id: 8, abbr: 'DET', name: 'Pistons', fullName: 'Detroit Pistons', city: 'Detroit', conference: 'East', division: 'Central', primary: '#C8102E', secondary: '#1D42BA' },
  { id: 9, abbr: 'GSW', name: 'Warriors', fullName: 'Golden State Warriors', city: 'Golden State', conference: 'West', division: 'Pacific', primary: '#1D428A', secondary: '#FFC72C' },
  { id: 10, abbr: 'HOU', name: 'Rockets', fullName: 'Houston Rockets', city: 'Houston', conference: 'West', division: 'Southwest', primary: '#CE1141', secondary: '#000000' },
  { id: 11, abbr: 'IND', name: 'Pacers', fullName: 'Indiana Pacers', city: 'Indiana', conference: 'East', division: 'Central', primary: '#002D62', secondary: '#FDBB30' },
  { id: 12, abbr: 'LAC', name: 'Clippers', fullName: 'Los Angeles Clippers', city: 'Los Angeles', conference: 'West', division: 'Pacific', primary: '#C8102E', secondary: '#1D428A' },
  { id: 13, abbr: 'LAL', name: 'Lakers', fullName: 'Los Angeles Lakers', city: 'Los Angeles', conference: 'West', division: 'Pacific', primary: '#552583', secondary: '#FDB927' },
  { id: 29, abbr: 'MEM', name: 'Grizzlies', fullName: 'Memphis Grizzlies', city: 'Memphis', conference: 'West', division: 'Southwest', primary: '#5D76A9', secondary: '#12173F' },
  { id: 14, abbr: 'MIA', name: 'Heat', fullName: 'Miami Heat', city: 'Miami', conference: 'East', division: 'Southeast', primary: '#98002E', secondary: '#F9A01B' },
  { id: 15, abbr: 'MIL', name: 'Bucks', fullName: 'Milwaukee Bucks', city: 'Milwaukee', conference: 'East', division: 'Central', primary: '#00471B', secondary: '#EEE1C6' },
  { id: 16, abbr: 'MIN', name: 'Timberwolves', fullName: 'Minnesota Timberwolves', city: 'Minnesota', conference: 'West', division: 'Northwest', primary: '#0C2340', secondary: '#236192' },
  { id: 3, abbr: 'NOP', name: 'Pelicans', fullName: 'New Orleans Pelicans', city: 'New Orleans', conference: 'West', division: 'Southwest', primary: '#0C2340', secondary: '#C8102E' },
  { id: 18, abbr: 'NYK', name: 'Knicks', fullName: 'New York Knicks', city: 'New York', conference: 'East', division: 'Atlantic', primary: '#006BB6', secondary: '#F58426' },
  { id: 25, abbr: 'OKC', name: 'Thunder', fullName: 'Oklahoma City Thunder', city: 'Oklahoma City', conference: 'West', division: 'Northwest', primary: '#007AC1', secondary: '#EF3B24' },
  { id: 19, abbr: 'ORL', name: 'Magic', fullName: 'Orlando Magic', city: 'Orlando', conference: 'East', division: 'Southeast', primary: '#0077C0', secondary: '#C4CED4' },
  { id: 20, abbr: 'PHI', name: '76ers', fullName: 'Philadelphia 76ers', city: 'Philadelphia', conference: 'East', division: 'Atlantic', primary: '#006BB6', secondary: '#ED174C' },
  { id: 21, abbr: 'PHX', name: 'Suns', fullName: 'Phoenix Suns', city: 'Phoenix', conference: 'West', division: 'Pacific', primary: '#1D1160', secondary: '#E56020' },
  { id: 22, abbr: 'POR', name: 'Trail Blazers', fullName: 'Portland Trail Blazers', city: 'Portland', conference: 'West', division: 'Northwest', primary: '#E03A3E', secondary: '#000000' },
  { id: 23, abbr: 'SAC', name: 'Kings', fullName: 'Sacramento Kings', city: 'Sacramento', conference: 'West', division: 'Pacific', primary: '#5A2D81', secondary: '#63727A' },
  { id: 24, abbr: 'SAS', name: 'Spurs', fullName: 'San Antonio Spurs', city: 'San Antonio', conference: 'West', division: 'Southwest', primary: '#C4CED4', secondary: '#000000' },
  { id: 28, abbr: 'TOR', name: 'Raptors', fullName: 'Toronto Raptors', city: 'Toronto', conference: 'East', division: 'Atlantic', primary: '#CE1141', secondary: '#000000' },
  { id: 26, abbr: 'UTA', name: 'Jazz', fullName: 'Utah Jazz', city: 'Utah', conference: 'West', division: 'Northwest', primary: '#002B5C', secondary: '#00471B' },
  { id: 27, abbr: 'WAS', name: 'Wizards', fullName: 'Washington Wizards', city: 'Washington', conference: 'East', division: 'Southeast', primary: '#002B5C', secondary: '#E31837' },
];

// Sample standings (realistic for mid-season)
const SAMPLE_STANDINGS: Record<string, { wins: number; losses: number }> = {
  'BOS': { wins: 32, losses: 10 },
  'CLE': { wins: 31, losses: 9 },
  'OKC': { wins: 32, losses: 8 },
  'NYK': { wins: 27, losses: 16 },
  'MIL': { wins: 24, losses: 17 },
  'MIA': { wins: 22, losses: 19 },
  'ORL': { wins: 24, losses: 19 },
  'IND': { wins: 23, losses: 19 },
  'DET': { wins: 21, losses: 21 },
  'ATL': { wins: 21, losses: 22 },
  'CHI': { wins: 20, losses: 22 },
  'BKN': { wins: 15, losses: 27 },
  'PHI': { wins: 18, losses: 22 },
  'TOR': { wins: 12, losses: 30 },
  'CHA': { wins: 10, losses: 30 },
  'WAS': { wins: 8, losses: 33 },
  'MEM': { wins: 27, losses: 16 },
  'HOU': { wins: 27, losses: 15 },
  'DEN': { wins: 26, losses: 16 },
  'LAC': { wins: 24, losses: 18 },
  'DAL': { wins: 24, losses: 18 },
  'MIN': { wins: 23, losses: 18 },
  'LAL': { wins: 23, losses: 18 },
  'GSW': { wins: 22, losses: 20 },
  'SAC': { wins: 21, losses: 22 },
  'PHX': { wins: 19, losses: 22 },
  'SAS': { wins: 19, losses: 23 },
  'POR': { wins: 17, losses: 25 },
  'UTA': { wins: 13, losses: 28 },
  'NOP': { wins: 12, losses: 31 },
};

async function seed() {
  console.log('🏀 Seeding Playmaker database...\n');

  // Create NBA league
  const league = await prisma.league.upsert({
    where: { externalId: 'nba' },
    update: {},
    create: {
      externalId: 'nba',
      name: 'National Basketball Association',
      abbreviation: 'NBA',
      sport: 'basketball',
      country: 'USA',
      logoUrl: 'https://cdn.nba.com/logos/leagues/logo-nba.svg',
    },
  });
  console.log('✅ Created NBA league');

  // Create current season
  const currentYear = new Date().getMonth() >= 9 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const seasonName = `${currentYear}-${String(currentYear + 1).slice(-2)}`;
  
  const season = await prisma.season.upsert({
    where: { externalId: seasonName },
    update: { isCurrent: true },
    create: {
      externalId: seasonName,
      leagueId: league.id,
      year: currentYear,
      name: seasonName,
      startDate: new Date(currentYear, 9, 22),
      endDate: new Date(currentYear + 1, 5, 20),
      isCurrent: true,
    },
  });
  console.log(`✅ Created season: ${seasonName}`);

  // Create all 30 teams with standings
  let teamCount = 0;
  for (const team of NBA_TEAMS) {
    const standings = SAMPLE_STANDINGS[team.abbr] || { wins: 0, losses: 0 };
    
    await prisma.team.upsert({
      where: { externalId: String(team.id) },
      update: {
        name: team.name,
        fullName: team.fullName,
        abbreviation: team.abbr,
        city: team.city,
        conference: team.conference,
        division: team.division,
        primaryColor: team.primary,
        secondaryColor: team.secondary,
        logoUrl: `https://a.espncdn.com/i/teamlogos/nba/500/${team.abbr.toLowerCase()}.png`,
        wins: standings.wins,
        losses: standings.losses,
      },
      create: {
        externalId: String(team.id),
        leagueId: league.id,
        name: team.name,
        fullName: team.fullName,
        abbreviation: team.abbr,
        city: team.city,
        conference: team.conference,
        division: team.division,
        primaryColor: team.primary,
        secondaryColor: team.secondary,
        logoUrl: `https://a.espncdn.com/i/teamlogos/nba/500/${team.abbr.toLowerCase()}.png`,
        wins: standings.wins,
        losses: standings.losses,
      },
    });
    teamCount++;
  }
  console.log(`✅ Created ${teamCount} NBA teams with standings`);

  // Create sample games for the week
  const teams = await prisma.team.findMany();
  const teamsByAbbr = Object.fromEntries(teams.map(t => [t.abbreviation, t]));

  // Today's games
  const todayGames = [
    { home: 'LAL', away: 'BOS', time: 19.5, venue: 'Crypto.com Arena', tv: 'ESPN' },
    { home: 'GSW', away: 'MIA', time: 19.5, venue: 'Chase Center', tv: 'TNT' },
    { home: 'CHI', away: 'NYK', time: 20, venue: 'United Center' },
    { home: 'PHX', away: 'DEN', time: 21, venue: 'Footprint Center' },
    { home: 'LAC', away: 'DAL', time: 22, venue: 'Intuit Dome', tv: 'ESPN' },
  ];

  // Tomorrow's games
  const tomorrowGames = [
    { home: 'BOS', away: 'CLE', time: 19, venue: 'TD Garden', tv: 'TNT' },
    { home: 'MIL', away: 'PHI', time: 19.5, venue: 'Fiserv Forum' },
    { home: 'MEM', away: 'OKC', time: 20, venue: 'FedExForum', tv: 'ESPN' },
    { home: 'MIN', away: 'HOU', time: 20, venue: 'Target Center' },
  ];

  let gameCount = 0;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Create today's games
  for (const g of todayGames) {
    const homeTeam = teamsByAbbr[g.home];
    const awayTeam = teamsByAbbr[g.away];
    if (!homeTeam || !awayTeam) continue;

    const gameTime = new Date(today);
    gameTime.setHours(Math.floor(g.time), (g.time % 1) * 60, 0, 0);

    await prisma.game.upsert({
      where: { externalId: `nba-${g.home}-${g.away}-${today.toISOString().split('T')[0]}` },
      update: {
        venue: g.venue,
        nationalTv: g.tv || null,
      },
      create: {
        externalId: `nba-${g.home}-${g.away}-${today.toISOString().split('T')[0]}`,
        seasonId: season.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        scheduledAt: gameTime,
        status: 'SCHEDULED',
        venue: g.venue,
        nationalTv: g.tv || null,
        dataSource: 'seed',
      },
    });
    gameCount++;
  }

  // Create tomorrow's games
  for (const g of tomorrowGames) {
    const homeTeam = teamsByAbbr[g.home];
    const awayTeam = teamsByAbbr[g.away];
    if (!homeTeam || !awayTeam) continue;

    const gameTime = new Date(tomorrow);
    gameTime.setHours(Math.floor(g.time), (g.time % 1) * 60, 0, 0);

    await prisma.game.upsert({
      where: { externalId: `nba-${g.home}-${g.away}-${tomorrow.toISOString().split('T')[0]}` },
      update: {
        venue: g.venue,
        nationalTv: g.tv || null,
      },
      create: {
        externalId: `nba-${g.home}-${g.away}-${tomorrow.toISOString().split('T')[0]}`,
        seasonId: season.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        scheduledAt: gameTime,
        status: 'SCHEDULED',
        venue: g.venue,
        nationalTv: g.tv || null,
        dataSource: 'seed',
      },
    });
    gameCount++;
  }

  console.log(`✅ Created ${gameCount} sample games`);

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - 1 League (NBA)`);
  console.log(`   - 1 Season (${seasonName})`);
  console.log(`   - 30 Teams with standings`);
  console.log(`   - ${gameCount} Games scheduled`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
