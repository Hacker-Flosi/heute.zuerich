'use client'

import styles from './RainIntro.module.css'

interface Props {
  dayLabel: string
}

export default function RainIntro({ dayLabel }: Props) {
  return (
    <li className={styles.intro}>
      <p className={styles.headline}>
        Dein Tag muss nicht ins Wasser fallen.
      </p>
      <p className={styles.sub}>
        Hier ist dein Schlechtwetter-Programm für {dayLabel} — nur Indoor-Events,
        Konzerte, Clubs, Kultur & Kunst.
      </p>
    </li>
  )
}
