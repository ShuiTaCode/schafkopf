/** Landschaft sperren und Android-Systemleiste verstecken — nur auf Nutzer-Geste. */
export function enableImmersivePlay() {
  const lockLandscape = () => {
    const orientation = screen.orientation
    if (orientation && typeof orientation.lock === 'function') {
      void orientation.lock('landscape').catch(() => {})
    }
  }

  const hideSystemNav = () => {
    const root = document.documentElement
    if (document.fullscreenElement) return
    const req =
      root.requestFullscreen?.bind(root) ??
      (
        root as HTMLElement & {
          webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void> | void
        }
      ).webkitRequestFullscreen?.bind(root)
    if (!req) return
    try {
      const result = req({ navigationUI: 'hide' })
      if (result && typeof result.catch === 'function') {
        void result.catch(() => {})
      }
    } catch {
      /* ignore */
    }
  }

  const onGesture = () => {
    lockLandscape()
    hideSystemNav()
  }

  lockLandscape()
  window.addEventListener('pointerdown', onGesture)
  return () => window.removeEventListener('pointerdown', onGesture)
}
