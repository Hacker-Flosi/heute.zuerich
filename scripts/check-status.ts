import { getSanityClient } from '../src/lib/sanity'
import { getDateString } from '../src/lib/constants'

async function main() {
  const client = getSanityClient()
  const d0 = getDateString(0)
  const d1 = getDateString(1)
  const d2 = getDateString(2)

  const counts = await client.fetch<Record<string, number>>(`{
    'zh_today': count(*[_type=='event' && city=='zuerich'    && date==$d0]),
    'zh_tom':   count(*[_type=='event' && city=='zuerich'    && date==$d1]),
    'zh_day':   count(*[_type=='event' && city=='zuerich'    && date==$d2]),
    'sg_today': count(*[_type=='event' && city=='stgallen'   && date==$d0]),
    'sg_tom':   count(*[_type=='event' && city=='stgallen'   && date==$d1]),
    'sg_day':   count(*[_type=='event' && city=='stgallen'   && date==$d2]),
    'lz_today': count(*[_type=='event' && city=='luzern'     && date==$d0]),
    'lz_tom':   count(*[_type=='event' && city=='luzern'     && date==$d1]),
    'lz_day':   count(*[_type=='event' && city=='luzern'     && date==$d2]),
    'bs_today': count(*[_type=='event' && city=='basel'      && date==$d0]),
    'bs_tom':   count(*[_type=='event' && city=='basel'      && date==$d1]),
    'bs_day':   count(*[_type=='event' && city=='basel'      && date==$d2]),
    'wt_today': count(*[_type=='event' && city=='winterthur' && date==$d0]),
    'wt_tom':   count(*[_type=='event' && city=='winterthur' && date==$d1]),
    'wt_day':   count(*[_type=='event' && city=='winterthur' && date==$d2])
  }`, { d0, d1, d2 })

  console.log(`\nEvent-Status Sanity (${d0} / ${d1} / ${d2}):`)
  console.log(`Zürich      heute: ${counts.zh_today} | morgen: ${counts.zh_tom} | übermorgen: ${counts.zh_day}`)
  console.log(`St.Gallen   heute: ${counts.sg_today} | morgen: ${counts.sg_tom} | übermorgen: ${counts.sg_day}`)
  console.log(`Luzern      heute: ${counts.lz_today} | morgen: ${counts.lz_tom} | übermorgen: ${counts.lz_day}`)
  console.log(`Basel       heute: ${counts.bs_today} | morgen: ${counts.bs_tom} | übermorgen: ${counts.bs_day}`)
  console.log(`Winterthur  heute: ${counts.wt_today} | morgen: ${counts.wt_tom} | übermorgen: ${counts.wt_day}`)
}

main().catch(console.error)
