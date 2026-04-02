# CLAUDE.md — heute.zürich Project Context

> This file gives Claude Code full context about the project.
> Read this before doing anything.

## What is this?

**heute.zürich** is a radically minimal website answering one question: "Was läuft heute in Zürich?" (What's happening today in Zurich?)

- AI-curated, 10–15 events per day
- No accounts, no filters, no categories
- One chronological list, click → external link to organizer
- Inspired by heute.sg (offline), a former St. Gallen event site

## Current State

### What's built
- Full Next.js 14 project structure (App Router)
- Sanity CMS event schema (12 fields)
- Sanity client + GROQ queries
- EventBlock + EventList components with CSS Modules
- Brutalist design: edge-to-edge colored blocks, black bg, Outfit + Space Mono fonts
- 12-color rotation system for event blocks
- Tab navigation: heute / morgen / übermorgen
- Eventfrog scraper (needs API endpoint fix — see below)
- hellozurich scraper (Cheerio HTML parsing)
- Deduplication logic (Levenshtein fuzzy matching)
- AI curation script (Claude Sonnet 4.6 via Anthropic API)
- Full daily pipeline orchestrator (scraping → dedup → curate → Sanity)
- Vercel Cron API route (/api/cron/pipeline, daily 05:00 UTC)
- vercel.json with cron config
- .cursorrules with full project context
- .env.example with all required variables

### What's NOT built yet
- Instagram automation (image generation + Meta Graph API posting)
- Sponsored listings functionality
- "Event melden" submission form
- SEO optimization
- Error handling / monitoring for pipeline
- Production deployment

## CRITICAL: Eventfrog API Issue

The Eventfrog API endpoint is unknown. We have an API key (Public API: Read, valid until 1.4.2027) but couldn't find the correct endpoint.

**What we tried (all failed):**
- `https://eventfrog.ch/api/v1/events` → 400 Bad Request
- `https://eventfrog.ch/api/events` → 404
- `https://api.eventfrog.net/events` → 200 but returns HTML (docs page)
- `https://api.eventfrog.ch/events` → DNS failure
- Various other combinations

**What to do:**
1. Install and use the `eventfrog-api` npm package (already in package.json):
   ```
   npm install eventfrog-api
   ```
2. The package is at: https://github.com/poljpocket/eventfrog-api
3. Usage:
   ```typescript
   import { EventfrogService, EventfrogEventRequest } from 'eventfrog-api'
   const service = new EventfrogService(process.env.EVENTFROG_API_KEY)
   const request = new EventfrogEventRequest({ perPage: 50, city: 'Zürich' })
   const result = await service.loadEvents(request)
   const events = result.datasets
   ```
4. Rewrite `scripts/scrapers/eventfrog.ts` to use this package instead of raw fetch
5. Run the test first to see the actual data structure:
   ```bash
   npm run test:eventfrog
   ```
6. If the npm package doesn't work either, check https://docs.api.eventfrog.net/ in a browser (JS-rendered docs)
7. Last resort: contact Eventfrog support at support@eventfrog.net

## Tech Stack

| Component | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| CMS | Sanity (Free Tier) |
| Hosting | Vercel |
| AI | Anthropic API (Claude Sonnet 4.6) — $3/$15 per MTok |
| Instagram | Meta Graph API (not built yet) |
| Image Gen | Satori + Sharp (not built yet) |
| Scraping | eventfrog-api npm + Cheerio for hellozurich |
| Scheduling | Vercel Cron Jobs |
| Code | GitHub (private repo) |

## Project Structure

```
heute-zuerich/
├── .cursorrules              # Cursor AI project context
├── .env                      # Environment variables (DO NOT COMMIT)
├── .env.example              # Template for env vars
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── vercel.json               # Cron: daily 05:00 UTC
├── README.md
├── CLAUDE.md                 # THIS FILE — project context for Claude Code
│
├── sanity/
│   └── schemas/
│       └── event.ts          # Sanity document schema (12 fields)
│
├── scripts/
│   ├── types.ts              # RawEvent, CuratedEvent types
│   ├── scrapers/
│   │   ├── eventfrog.ts      # ⚠️ NEEDS FIX — use eventfrog-api package
│   │   └── hellozurich.ts    # Cheerio HTML scraper
│   ├── deduplicate.ts        # Levenshtein fuzzy matching + merge
│   ├── curate.ts             # Claude Sonnet AI curation
│   ├── pipeline.ts           # Daily orchestrator
│   └── test-eventfrog.ts     # API test script
│
├── src/
│   ├── app/
│   │   ├── globals.css       # Fonts: Outfit + Space Mono
│   │   ├── layout.tsx        # Root layout + SEO metadata
│   │   ├── page.tsx          # Main page (Server Component)
│   │   └── api/cron/pipeline/
│   │       └── route.ts      # Vercel Cron endpoint (secured with CRON_SECRET)
│   ├── components/
│   │   ├── EventBlock.tsx    # Single colored event block
│   │   ├── EventBlock.module.css
│   │   ├── EventList.tsx     # List + header + tabs + footer (Client Component)
│   │   └── EventList.module.css
│   └── lib/
│       ├── constants.ts      # 12 colors, Event type, date helpers
│       ├── queries.ts        # GROQ queries for Sanity
│       └── sanity.ts         # Read + Write Sanity clients
│
└── public/
```

## Environment Variables

```
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=   # From sanity.io/manage
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=                # Write token from sanity.io/manage

# Eventfrog
EVENTFROG_API_KEY=               # ✅ Already set

# Anthropic
ANTHROPIC_API_KEY=               # From console.anthropic.com

# Instagram (Phase 2)
META_ACCESS_TOKEN=
INSTAGRAM_ACCOUNT_ID=

# Vercel Cron Security
CRON_SECRET=                     # Random string, set in Vercel dashboard
```

## Design System

### Colors (12-color rotation for event blocks)
```
#FF0000  Red
#FF00FF  Magenta
#00E5FF  Cyan
#FFFFFF  White
#FFB800  Orange/Yellow
#00E05A  Green
#5B5BFF  Blue
#FF4D94  Pink
#C864FF  Purple
#FFE500  Yellow
#FF6B35  Deep Orange
#00FF94  Mint
```

### Typography
- **Event names:** Outfit, weight 900, uppercase, 1.5–2rem
- **Location/Time:** Space Mono, 0.72rem
- **Logo:** Outfit or custom, yellow (#F5A623) on black
- **UI/Nav:** Space Mono, 0.72rem, lowercase

### Layout per event block
- Background: full-width colored block, no border-radius
- Top left: Location (mono, small)
- Top right: Time (mono, small, bold)
- Bottom: Event name (display, large, bold, uppercase)
- Entire block is clickable → external link
- Separated by 1.5px black border

## Daily Pipeline (05:00 UTC)

```
05:00  Scraping    → Eventfrog API + hellozurich HTML → raw events
05:15  Dedup       → Fuzzy match on name + location + time (±30min)
05:30  Curate      → Claude Sonnet selects 10–15 events per day
06:00  Website     → Write to Sanity, ISR revalidates
06:30  Images      → Generate Feed-Post (1080×1350) + Stories (1080×1920)
07:30  Instagram   → Publish via Meta Graph API
```

## AI Curation Criteria

The system prompt instructs Claude to select based on:
1. **Venue reputation (30%)** — A-tier venues: Kaufleuten, X-TRA, Moods, Bogen F, Plaza, Mascotte, Exil, Zukunft, Hive, Rote Fabrik, etc.
2. **Event quality & uniqueness (30%)** — One-time > recurring, known acts > no-names
3. **Diversity (20%)** — Max 5 same type, mix neighborhoods, time spread
4. **Broad relevance (20%)** — General audience, no business/networking events

**Always exclude:** Yoga/Pilates classes, kids-only events, escape rooms, tourist tours, events without clear time

## Notion Documentation

All project docs live in Notion under "📍 heute.zh":
- 📋 Produkt — Vision, audience, feature scope, MVP definition
- 🎨 Design — Layout, colors, typography, Instagram templates
- ⚙️ Technik — Architecture, scraping sources, data model, costs
- 📱 Social Media — Instagram strategy, automation, growth
- 💰 Business — Monetization, legal, domain, cost breakdown (~CHF 315/year)
- ✅ Aufgaben — Task database with 29 tasks

## MVP Timeline (6–7 weeks)

- [x] Week 1–2: Foundation (project setup, layout) — MOSTLY DONE
- [ ] Week 2–3: Scraping (Eventfrog + hellozurich) — IN PROGRESS, blocked on Eventfrog API
- [ ] Week 3–4: AI Curation (prompt testing with real data)
- [ ] Week 4–5: Website live (Sanity connection, deploy, domain)
- [ ] Week 5–6: Instagram automation (templates, image gen, Meta API)
- [ ] Week 6–7: Pipeline + Launch (cron, error handling, 5-day test run)

## Immediate Next Steps

1. **Fix Eventfrog scraper** — Rewrite to use `eventfrog-api` npm package
2. **Run first successful API call** — See actual event data structure
3. **Set up Sanity project** — `npx sanity init`, deploy schema
4. **Connect Next.js to Sanity** — Verify events render on the page
5. **Test full pipeline** — Scrape → Deduplicate → Curate → Display

## Language Convention
- Code: English variable names, German/English comments
- UI text: German
- Docs: German (Notion) + English (code docs)

## Owner
Florin Grunder — Senior UI/UX Designer, Zürich
