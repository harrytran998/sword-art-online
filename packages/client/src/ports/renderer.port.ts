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
  readonly showDamageNumber: (x: number, y: number, amount: number, isCritical?: boolean) => void
  readonly showSkillEffect: (x: number, y: number, skillId: number, isPlayer: boolean) => void
  readonly showGlowEffect: (playerId: string, color: number) => void
  readonly getEntityAt: (x: number, y: number) => string | null
  readonly screenToWorld: (x: number, y: number) => { x: number; y: number }
}
