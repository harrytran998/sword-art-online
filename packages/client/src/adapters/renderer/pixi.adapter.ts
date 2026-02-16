import { Application, Container, Graphics, Text } from "pixi.js"
import type { RendererPort } from "@ports/renderer.port"

const TILE_SIZE = 32
const GRID_COLOR = 0x1a2a3a
const GRID_LINE_COLOR = 0x253545
const LOCAL_PLAYER_COLOR = 0x4488ff
const REMOTE_PLAYER_COLOR = 0x44cc88
const PLAYER_SIZE = 20
const DAMAGE_COLOR = 0xff4444

interface PlayerSprite {
  container: Container
  body: Graphics
  nameLabel: Text
}

export const createPixiAdapter = (): RendererPort => {
  let app: Application | null = null
  const mapContainer = new Container()
  const playerSprites = new Map<string, PlayerSprite>()

  const drawGrid = (width: number, height: number) => {
    const grid = new Graphics()

    // Background
    grid.rect(-width / 2, -height / 2, width, height)
    grid.fill(GRID_COLOR)

    // Grid lines
    grid.setStrokeStyle({ width: 1, color: GRID_LINE_COLOR, alpha: 0.3 })
    for (let x = -width / 2; x <= width / 2; x += TILE_SIZE) {
      grid.moveTo(x, -height / 2)
      grid.lineTo(x, height / 2)
    }
    for (let y = -height / 2; y <= height / 2; y += TILE_SIZE) {
      grid.moveTo(-width / 2, y)
      grid.lineTo(width / 2, y)
    }
    grid.stroke()

    return grid
  }

  return {
    init: async (canvas) => {
      app = new Application()
      const initOptions: Record<string, unknown> = {
        canvas,
        background: GRID_COLOR,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio,
      }
      if (canvas.parentElement) {
        initOptions.resizeTo = canvas.parentElement
      }
      await app.init(initOptions)

      const grid = drawGrid(6400, 6400)
      mapContainer.addChild(grid)
      app.stage.addChild(mapContainer)
    },

    destroy: () => {
      if (app) {
        app.destroy(true)
        app = null
      }
      playerSprites.clear()
    },

    resize: (width, height) => {
      if (app) {
        app.renderer.resize(width, height)
      }
    },

    render: () => {
      if (app) {
        app.render()
      }
    },

    setCamera: (x, y, _zoom) => {
      if (!app) return
      const screenW = app.screen.width
      const screenH = app.screen.height
      mapContainer.x = screenW / 2 - x
      mapContainer.y = screenH / 2 - y
    },

    addPlayer: (id, name, x, y, isLocal) => {
      if (!app) return
      if (playerSprites.has(id)) return

      const container = new Container()
      container.x = x
      container.y = y

      const body = new Graphics()
      body.rect(
        -PLAYER_SIZE / 2,
        -PLAYER_SIZE / 2,
        PLAYER_SIZE,
        PLAYER_SIZE,
      )
      body.fill(isLocal ? LOCAL_PLAYER_COLOR : REMOTE_PLAYER_COLOR)

      // Direction indicator
      body.moveTo(0, -PLAYER_SIZE / 2)
      body.lineTo(PLAYER_SIZE / 3, PLAYER_SIZE / 4)
      body.lineTo(-PLAYER_SIZE / 3, PLAYER_SIZE / 4)
      body.closePath()
      body.fill(isLocal ? 0x6699ff : 0x66ddaa)

      const nameLabel = new Text({
        text: name || id.slice(0, 8),
        style: {
          fontSize: 11,
          fill: 0xffffff,
          fontFamily: "monospace",
          align: "center",
        },
      })
      nameLabel.anchor.set(0.5)
      nameLabel.y = -PLAYER_SIZE / 2 - 10

      container.addChild(body)
      container.addChild(nameLabel)
      mapContainer.addChild(container)

      playerSprites.set(id, { container, body, nameLabel })
    },

    updatePlayer: (id, x, y, rotation) => {
      const sprite = playerSprites.get(id)
      if (!sprite) return
      sprite.container.x = x
      sprite.container.y = y
      sprite.body.rotation = rotation
    },

    removePlayer: (id) => {
      const sprite = playerSprites.get(id)
      if (!sprite) return
      mapContainer.removeChild(sprite.container)
      sprite.container.destroy({ children: true })
      playerSprites.delete(id)
    },

    showDamageNumber: (x, y, amount) => {
      if (!app) return

      const text = new Text({
        text: `-${amount}`,
        style: {
          fontSize: 16,
          fill: DAMAGE_COLOR,
          fontWeight: "bold",
          fontFamily: "monospace",
        },
      })
      text.anchor.set(0.5)
      text.x = x
      text.y = y

      mapContainer.addChild(text)

      // Animate upward and fade
      let frame = 0
      const maxFrames = 40
      const animate = () => {
        frame++
        text.y -= 1.5
        text.alpha = 1 - frame / maxFrames
        if (frame >= maxFrames) {
          mapContainer.removeChild(text)
          text.destroy()
        } else {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    },
  }
}
