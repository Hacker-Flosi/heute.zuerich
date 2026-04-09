'use client'

import { useMemo } from 'react'
import styles from './RainEffect.module.css'

const DROP_COUNT = 60

export default function RainEffect() {
  const drops = useMemo(() => {
    return Array.from({ length: DROP_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 0.4 + Math.random() * 0.4,
      height: 15 + Math.random() * 18,
      opacity: 0.15 + Math.random() * 0.35,
    }))
  }, [])

  return (
    <div className={styles.overlay} aria-hidden="true">
      {drops.map(drop => (
        <span
          key={drop.id}
          className={styles.drop}
          style={{
            left: `${drop.left}%`,
            animationDelay: `${drop.delay}s`,
            animationDuration: `${drop.duration}s`,
            height: `${drop.height}px`,
            opacity: drop.opacity,
          }}
        />
      ))}
    </div>
  )
}
