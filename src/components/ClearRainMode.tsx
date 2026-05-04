'use client'
import { useEffect } from 'react'

export default function ClearRainMode() {
  useEffect(() => {
    document.documentElement.dataset.rain = 'false'
  }, [])
  return null
}
