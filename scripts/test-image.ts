// scripts/test-image.ts — Lokaler Test für generateCombinedTitleSlide
import { generateCombinedTitleSlide, getColor } from './generate-image-v2'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  const dateLabel = 'Di, 28. April'
  const phrases = 10
  for (let i = 0; i < phrases; i++) {
    const colorIndex = i % 12
    console.log(`Generiere Slide ${i + 1}/10 (Farbe ${getColor(colorIndex)})...`)
    const buf = await generateCombinedTitleSlide(dateLabel, colorIndex, i)
    const out = path.join(process.cwd(), 'scripts', 'assets', `test-title-${i + 1}.png`)
    fs.writeFileSync(out, buf)
    console.log(`  → ${out}`)
  }
}

main().catch(console.error)
