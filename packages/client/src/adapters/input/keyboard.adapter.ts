export interface KeyboardCallbacks {
  readonly onMove: (dx: number, dz: number) => void
  readonly onStop: () => void
}

export const createKeyboardAdapter = (callbacks: KeyboardCallbacks) => {
  const keys = new Set<string>()

  const getMovement = (): { dx: number; dz: number } => {
    let dx = 0
    let dz = 0
    if (keys.has("w") || keys.has("arrowup")) dz -= 1
    if (keys.has("s") || keys.has("arrowdown")) dz += 1
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1
    if (keys.has("d") || keys.has("arrowright")) dx += 1
    return { dx, dz }
  }

  const emitMovement = () => {
    const { dx, dz } = getMovement()
    if (dx !== 0 || dz !== 0) {
      callbacks.onMove(dx, dz)
    } else {
      callbacks.onStop()
    }
  }

  const MOVEMENT_KEYS = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"])

  const onKeyDown = (e: KeyboardEvent) => {
    // Ignore input when typing in an input field
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return
    }

    const key = e.key.toLowerCase()
    // Prevent arrow keys from scrolling the page
    if (MOVEMENT_KEYS.has(key)) {
      e.preventDefault()
    }
    if (!keys.has(key)) {
      keys.add(key)
      emitMovement()
    }
  }

  const onKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    keys.delete(key)
    emitMovement()
  }

  const attach = () => {
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
  }

  const detach = () => {
    window.removeEventListener("keydown", onKeyDown)
    window.removeEventListener("keyup", onKeyUp)
    keys.clear()
  }

  return { attach, detach, getMovement }
}
