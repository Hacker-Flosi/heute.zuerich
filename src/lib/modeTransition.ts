/**
 * Radial wipe transition — circle expands from button origin,
 * switches the mode at peak, then fades out.
 */
export function triggerModeTransition(
  targetColor: string,
  originX: string,
  originY: string,
  onSwitch: () => void
) {
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    background: ${targetColor};
    clip-path: circle(0px at ${originX} ${originY});
    transition: clip-path 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  `
  document.body.appendChild(overlay)

  // Expand
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.clipPath = `circle(200vmax at ${originX} ${originY})`
    })
  })

  // Switch mode slightly before fully covered
  setTimeout(onSwitch, 400)

  // Fade out overlay after expansion
  setTimeout(() => {
    overlay.style.transition = 'opacity 0.35s ease'
    overlay.style.opacity = '0'
    setTimeout(() => overlay.remove(), 380)
  }, 560)
}
