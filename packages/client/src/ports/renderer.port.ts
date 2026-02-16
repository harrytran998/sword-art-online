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
  readonly addPlayer: (
    id: string,
    name: string,
    x: number,
    y: number,
    isLocal: boolean,
  ) => void
  readonly updatePlayer: (
    id: string,
    x: number,
    y: number,
    rotation: number,
  ) => void
  readonly removePlayer: (id: string) => void
  readonly showDamageNumber: (x: number, y: number, amount: number) => void
}
