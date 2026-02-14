/**
 * RendererPort — interface for game rendering.
 * Adapters: PixiJSAdapter
 */
export interface RendererPort {
  readonly init: (canvas: HTMLCanvasElement) => Promise<void>
  readonly destroy: () => void
  readonly resize: (width: number, height: number) => void
  readonly render: () => void
  readonly setCamera: (x: number, y: number, zoom: number) => void
}
