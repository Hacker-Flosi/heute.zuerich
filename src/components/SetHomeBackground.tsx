'use client'
import { useEffect } from 'react'

// Sets html/body background to homepage green so Safari overscroll
// and pull-down don't show the default page background.
export default function SetHomeBackground() {
  useEffect(() => {
    const el = document.documentElement
    const prev = el.style.background
    el.style.background = '#00E05A'
    return () => { el.style.background = prev }
  }, [])
  return null
}
