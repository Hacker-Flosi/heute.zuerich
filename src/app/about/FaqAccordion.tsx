'use client'

import { useState } from 'react'
import styles from './about.module.css'

interface FaqItem { q: string; a: string }

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <dl className={styles.faqList}>
      {items.map((item, i) => (
        <div key={item.q} className={styles.faqItem}>
          <dt
            className={styles.faqQ}
            onClick={() => setOpen(open === i ? null : i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setOpen(open === i ? null : i)}
          >
            <span>{item.q}</span>
            <span className={styles.faqArrow}>{open === i ? '▲' : '▼'}</span>
          </dt>
          {open === i && <dd className={styles.faqA}>{item.a}</dd>}
        </div>
      ))}
    </dl>
  )
}
