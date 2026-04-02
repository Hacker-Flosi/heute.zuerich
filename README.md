# heute.zürich

> Was läuft heute in Zürich? — AI-kuratiert, 10–15 Events pro Tag.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **CMS:** Sanity
- **Hosting:** Vercel
- **AI:** Anthropic API (Claude Sonnet 4.6)
- **Instagram:** Meta Graph API
- **Styling:** CSS Modules + Space Mono + Outfit

## Projektstruktur

```
heute-zuerich/
├── sanity/
│   └── schemas/
│       └── event.ts          # Sanity Event-Schema
├── scripts/
│   └── curate.ts             # AI-Kuratierungs-Pipeline
├── src/
│   ├── app/
│   │   ├── globals.css       # Globale Styles
│   │   ├── layout.tsx        # Root Layout + Metadata
│   │   └── page.tsx          # Hauptseite (Server Component)
│   ├── components/
│   │   ├── EventBlock.tsx     # Einzelner Event-Block
│   │   ├── EventBlock.module.css
│   │   ├── EventList.tsx      # Event-Liste mit Tabs (Client Component)
│   │   └── EventList.module.css
│   └── lib/
│       ├── constants.ts       # Farben, Types, Helpers
│       ├── queries.ts         # GROQ Queries
│       └── sanity.ts          # Sanity Client Config
├── .env.example              # Umgebungsvariablen Template
└── README.md
```

## Setup

1. **Sanity Projekt erstellen:** `npx sanity init`
2. **Env-Variablen:** `.env.example` → `.env.local` kopieren und ausfüllen
3. **Dependencies:** `npm install`
4. **Dev Server:** `npm run dev`
5. **Vercel deployen:** `vercel --prod`

## Tägliche Pipeline

| Zeit  | Schritt           | Beschreibung                              |
|-------|-------------------|-------------------------------------------|
| 05:00 | Scraping          | Eventfrog + hellozurich → Sanity          |
| 05:15 | Deduplizierung    | Fuzzy Matching auf Name + Location + Zeit |
| 05:30 | AI-Kuratierung    | Claude wählt 10–15 Events aus             |
| 06:00 | Website-Update    | Vercel ISR revalidiert automatisch        |
| 06:30 | Grafik-Generierung| Feed-Post + Stories programmatisch        |
| 07:30 | Instagram         | Publishing via Meta Graph API             |

## Lizenz

Private — nicht öffentlich.
