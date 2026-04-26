import { scrapeBaselVenues } from './scrapers/basel-venues'

const date = process.argv[2] ?? '2026-04-26'

async function main() {
  console.log(`\n── Basel Venues (${date}) ──`)
  const events = await scrapeBaselVenues(date)
  events.forEach(e => console.log(`  ${e.time} ${e.name} @ ${e.location}`))
  console.log(`\nTotal: ${events.length}`)
}

main()
