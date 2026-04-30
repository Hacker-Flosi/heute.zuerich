'use client'

import { useEffect, useState } from 'react'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isRain, setIsRain] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    const initial = saved ?? 'light'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)

    // Read initial rain state
    setIsRain(document.documentElement.dataset.rain === 'true')

    // Watch for rain state changes
    const observer = new MutationObserver(() => {
      setIsRain(document.documentElement.dataset.rain === 'true')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-rain'] })
    return () => observer.disconnect()
  }, [])

  function toggle() {
    if (isRain) return
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const colorful = theme === 'dark' && !isRain

  return (
    <button
      className={`${styles.toggle} ${colorful ? styles.colorful : ''}`}
      onClick={toggle}
      disabled={isRain}
      aria-label={theme === 'light' ? 'Dark Mode aktivieren' : 'Light Mode aktivieren'}
    >
      {colorful ? (
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <g clipPath="url(#colormode)">
            <rect width="32" height="6" fill="#00E05A"/>
            <rect y="6" width="32" height="6" fill="#FE01FF"/>
            <rect y="12" width="32" height="7" fill="#FFE403"/>
            <rect y="19" width="32" height="7" fill="#FE0100"/>
            <rect y="26" width="32" height="6" fill="#0ED3EA"/>
          </g>
          <defs>
            <clipPath id="colormode">
              <rect width="32" height="32" rx="16" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor" aria-hidden="true">
          <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80v-640q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z"/>
        </svg>
      )}
    </button>
  )
}
