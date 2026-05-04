'use client'

import styles from '../about/about.module.css'

export default function ConsentRevokeButton() {
  function revoke() {
    localStorage.removeItem('cookie_consent')
    window.location.reload()
  }

  return (
    <button className={styles.revokeButton} onClick={revoke}>
      Cookie-Einwilligung zurückziehen
    </button>
  )
}
