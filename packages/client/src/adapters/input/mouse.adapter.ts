export interface MouseCallbacks {
  readonly onClick: (x: number, y: number) => void
}

export const createMouseAdapter = (
  canvas: HTMLCanvasElement,
  callbacks: MouseCallbacks,
) => {
  const onClick = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    callbacks.onClick(x, y)
  }

  const attach = () => {
    canvas.addEventListener("click", onClick)
  }

  const detach = () => {
    canvas.removeEventListener("click", onClick)
  }

  return { attach, detach }
}
