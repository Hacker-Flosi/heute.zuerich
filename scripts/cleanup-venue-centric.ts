#!/usr/bin/env tsx
// scripts/cleanup-venue-centric.ts
// ─────────────────────────────────────────────────────────────────────────────
// Entfernt ALLES vom venue-zentrischen System — Sanity-Daten + lokale Dateien.
// Das bestehende System (events, venues, pipeline) wird NICHT berührt.
//
// Aufruf: npx tsx scripts/cleanup-venue-centric.ts
//         npx tsx scripts/cleanup-venue-centric.ts --dry-run   (nur anzeigen)
//
// Nach diesem Script: git revert 8b7b81d (oder alle venue-centric commits)
// ─────────────────────────────────────────────────────────────────────────────

import { getSanityWriteClient } from '../src/lib/sanity'
import * as fs from 'fs'
import * as path from 'path'

const DRY_RUN = process.argv.includes('--dry-run')
const ROOT = path.join(__dirname, '..')

// ─── Dateien/Ordner die zum neuen System gehören ──────────────────────────────

const FILES_TO_DELETE = [
  // Dieses Script selbst
  'scripts/cleanup-venue-centric.ts',
  // Scraper-System
  'scripts/venue-centric/',
  // Sanity Schema
  'sanity/schemas/eventVenueCentric.ts',
  // Frontend Test-Route
  'src/app/zuerich-v2/',
]

// ─── Sanity Cleanup ───────────────────────────────────────────────────────────

async function cleanSanity(): Promise<void> {
  const client = getSanityWriteClient()

  // 1. Alle eventVenueCentric-Dokumente löschen
  const vcEvents = await client.fetch('*[_type == "eventVenueCentric"]._id')
  console.log(`Sanity: ${vcEvents.length} eventVenueCentric-Dokumente gefunden`)
  if (vcEvents.length > 0) {
    if (!DRY_RUN) {
      for (const id of vcEvents) {
        await client.delete(id)
      }
    }
    console.log(`  ${DRY_RUN ? '[dry-run] würde löschen' : '✅ gelöscht'}: ${vcEvents.length} eventVenueCentric-Dokumente`)
  }

  // 2. scrapeSources von allen Venue-Dokumenten entfernen
  const venuesWithSources = await client.fetch(
    '*[_type == "venue" && defined(scrapeSources) && count(scrapeSources) > 0]._id'
  )
  console.log(`Sanity: ${venuesWithSources.length} Venues mit scrapeSources gefunden`)
  if (venuesWithSources.length > 0) {
    if (!DRY_RUN) {
      for (const id of venuesWithSources) {
        await client.patch(id).unset(['scrapeSources']).commit()
      }
    }
    console.log(`  ${DRY_RUN ? '[dry-run] würde entfernen' : '✅ entfernt'}: scrapeSources aus ${venuesWithSources.length} Venues`)
  }
}

// ─── Datei-Cleanup ────────────────────────────────────────────────────────────

function deleteIfExists(relPath: string): void {
  const absPath = path.join(ROOT, relPath)
  if (!fs.existsSync(absPath)) return

  const isDir = fs.statSync(absPath).isDirectory()
  if (DRY_RUN) {
    console.log(`  [dry-run] würde löschen: ${relPath}${isDir ? '/' : ''}`)
    return
  }

  if (isDir) {
    fs.rmSync(absPath, { recursive: true })
  } else {
    fs.unlinkSync(absPath)
  }
  console.log(`  ✅ gelöscht: ${relPath}`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  Venue-Centric Cleanup${DRY_RUN ? ' [DRY-RUN — keine Änderungen]' : ''}`)
  console.log(`${'─'.repeat(60)}\n`)

  // Sanity
  console.log('── Sanity Daten ──')
  await cleanSanity()

  // Dateien
  console.log('\n── Lokale Dateien ──')
  for (const f of FILES_TO_DELETE) {
    deleteIfExists(f)
  }

  // Git-Anleitung
  console.log(`
── Git ──
Schema-Änderung rückgängig machen:

  git revert 8b7b81d --no-edit
  git push

Oder alle venue-centric Commits auf einmal:

  git log --oneline | grep -i "venue-centric\\|phase"
  git revert <commit-hash> --no-edit

${'─'.repeat(60)}
${DRY_RUN ? '⚠️  DRY-RUN: keine Änderungen vorgenommen' : '✅ Cleanup abgeschlossen — bestehendes System unberührt'}
`)
}

main().catch((err) => {
  console.error('Cleanup fehlgeschlagen:', err)
  process.exit(1)
})
