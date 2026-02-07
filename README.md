# SportSense V2

**AI-Native Live Sports Platform for NBA**

Real-time NBA scores, play-by-play, box scores, and AI-powered game analysis using Google Gemini.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-5-teal)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-purple)

---

## 🏀 Features

- **Live Scoreboard** - Real-time NBA game scores with SSE updates
- **Game Details** - Box scores, play-by-play, team stats
- **AI Chat** - Ask questions about any game, powered by Gemini
- **AI Summaries** - Auto-generated pregame previews, halftime reports, final recaps
- **Team Pages** - Full rosters, recent and upcoming games

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud: Neon, Supabase, etc.)
- Google Gemini API key (for AI features)
- Upstash Redis (optional, for caching/rate limiting)

### 1. Clone and Install

```bash
cd SportSenseV2
npm install
```

### 2. Configure Environment

Copy the template and fill in your values:

```bash
cp env.template .env
```

**Required variables:**

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/sportsense"

# Google Gemini API key (get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY="your-gemini-api-key"

# NextAuth secret (generate: openssl rand -base64 32)
NEXTAUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

**Optional (but recommended):**

```env
# Upstash Redis for caching
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Ball Don't Lie API key for higher rate limits
BALLDONTLIE_API_KEY=""
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Sync NBA Data

```bash
# Sync all data (teams, players, games)
npm run sync:full

# Or sync individually
npm run sync:teams
npm run sync:players
npm run sync:games
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── games/         # Game endpoints
│   │   ├── teams/         # Team endpoints
│   │   ├── ai/            # AI chat & summaries
│   │   ├── live/          # SSE for real-time
│   │   └── sync/          # Data sync triggers
│   ├── games/[id]/        # Game detail page
│   ├── teams/             # Teams listing
│   └── page.tsx           # Home (scoreboard)
├── components/
│   ├── ui/                # Base UI components
│   ├── games/             # Game-related components
│   ├── ai/                # AI chat component
│   └── layout/            # Header, footer
├── lib/                   # Core utilities
│   ├── db.ts              # Prisma client
│   ├── redis.ts           # Redis/caching
│   ├── logger.ts          # Structured logging
│   └── utils.ts           # Helpers
├── services/
│   ├── nba/               # NBA data fetching & sync
│   └── ai/                # Gemini AI integration
├── types/                 # TypeScript types
└── generated/             # Prisma generated client
```

---

## 🔌 API Endpoints

### Games

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/games` | GET | List games (filter by date, team, status) |
| `/api/games/[id]` | GET | Game details with plays & stats |

### Teams

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/teams` | GET | List all teams |
| `/api/teams/[id]` | GET | Team details with roster |

### AI

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | POST | Chat about a game |
| `/api/ai/summary` | POST | Generate game summary |

### Live Updates

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/live` | GET | SSE stream for live scores |

### Sync

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sync` | GET | Check sync status |
| `/api/sync` | POST | Trigger data sync |

---

## 🤖 AI Integration

### How AI Grounding Works

Every AI call receives:
1. Current game state (scores, period, clock)
2. Recent plays (last 10)
3. Statistical leaders from both teams
4. Data timestamp and source

The AI is instructed to:
- ONLY use provided data
- Never hallucinate statistics
- Say "I don't know" if data is missing
- Cite timestamps when relevant

### Example Chat

```
User: "Who's leading the scoring?"

AI: "LeBron James is leading all scorers with 28 points on 10-15 
shooting. For the Celtics, Jayson Tatum has 24 points. 
[Data as of 8:45 PM EST]"
```

---

## 📊 Data Sources

| Source | Usage | Rate Limit |
|--------|-------|------------|
| Ball Don't Lie API | Teams, players, games, stats | 30 req/min (free) |
| NBA Stats CDN | Live scores, play-by-play | No official limit |

### Legal Considerations

- Ball Don't Lie: Official API with terms of service
- NBA Stats: Public endpoints, no official API
- We implement rate limiting and caching to be respectful
- No personal data collected beyond public stats
- Not affiliated with the NBA

---

## 🔧 Development

### Database Commands

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema changes
npm run db:migrate    # Create migration
npm run db:studio     # Open Prisma Studio
```

### Sync Commands

```bash
npm run sync:full     # Sync everything
npm run sync:teams    # Teams only
npm run sync:players  # Players only
npm run sync:games    # Games only (current season)
```

### Environment

```bash
npm run dev           # Development server
npm run build         # Production build
npm run start         # Production server
npm run lint          # Run linter
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```env
DATABASE_URL=          # Production Postgres URL
GEMINI_API_KEY=        # Your Gemini key
NEXTAUTH_SECRET=       # Generate new for prod
NEXTAUTH_URL=          # Your production URL
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SYNC_API_KEY=          # Protect sync endpoint
```

### Cron Jobs

Set up cron to keep data fresh:

```bash
# Sync games every 5 minutes during game hours
*/5 18-23 * * * curl -X POST https://yourapp.com/api/sync -H "Authorization: Bearer $SYNC_API_KEY" -d '{"type":"games"}'
```

---

## 📈 Monitoring

### Logging

All API calls, data syncs, and AI invocations are logged:

```typescript
logger.api.request('GET', '/api/games', { date: '2024-01-06' });
logger.data.sync('balldontlie', 'teams sync complete', { count: 30 });
logger.ai.invoke('gemini-1.5-flash', 'chat', { tokensUsed: 450 });
```

### Health Checks

- `/api/sync` (GET) - Returns database counts and recent sync logs

---

## 🧪 Testing During Live Games

1. Run `npm run sync:games` before game time
2. Open the app to see scheduled games
3. When games start, they'll appear as LIVE
4. SSE will automatically push score updates
5. Try the AI chat to ask about the live game

---

## 📝 License

MIT

---

## 🙏 Credits

- Data from [Ball Don't Lie API](https://www.balldontlie.io/)
- AI powered by [Google Gemini](https://ai.google.dev/)
- Inspired by [Real Sports](https://www.realsports.io/)
