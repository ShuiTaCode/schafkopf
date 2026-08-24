/** Immersive fullscreen for installed PWA — hides Android system nav when possible. */
export function enableImmersivePwa() {
  const isInstalled = () =>
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))

  const requestHideChrome = () => {
    if (!isInstalled()) return
    const root = document.documentElement
    if (document.fullscreenElement) return
    const req =
      root.requestFullscreen?.bind(root) ??
      (
        root as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void> | void
        }
      ).webkitRequestFullscreen?.bind(root)
    if (!req) return
    try {
      const result = req({ navigationUI: 'hide' } as FullscreenOptions)
      if (result && typeof (result as Promise<void>).catch === 'function') {
        ;(result as Promise<void>).catch(() => {
          /* Browser may deny without gesture or policy */
        })
      }
    } catch {
      /* ignore */
    }
  }

  // First tap / click often needed for Fullscreen API
  const onInteract = () => {
    requestHideChrome()
  }
  window.addEventListener('pointerdown', onInteract, { passive: true })
  window.addEventListener('keydown', onInteract)

  // Also try once if already allowed
  requestHideChrome()

  return () => {
    window.removeEventListener('pointerdown', onInteract)
    window.removeEventListener('keydown', onInteract)
  }
}
