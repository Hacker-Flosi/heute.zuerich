// Einmalig: löscht alle Events für eine Stadt/Datum damit die Pipeline neu läuft
import { getSanityWriteClient } from '../src/lib/sanity'

const city = process.argv[2]
const date = process.argv[3]

if (!city || !date) {
  console.error('Usage: tsx reset-city-date.ts <city> <date>')
  process.exit(1)
}

async function main() {
  const client = getSanityWriteClient()
  const ids: string[] = await client.fetch(
    `*[_type == "event" && city == $city && date == $date]._id`,
    { city, date }
  )
  if (ids.length === 0) {
    console.log(`Keine Events für ${city}/${date}`)
    return
  }
  const tx = client.transaction()
  for (const id of ids) tx.delete(id)
  await tx.commit()
  console.log(`${ids.length} Events gelöscht für ${city}/${date}`)
}

main().catch(console.error)
