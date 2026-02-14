/**
 * Binary protocol for high-frequency position updates.
 * Uses ArrayBuffer for minimal overhead.
 *
 * Format: [messageType: u8][playerId: 16 bytes][x: f32][y: f32][z: f32][rotation: f32]
 * Total: 33 bytes per position update
 */

export const POSITION_UPDATE_SIZE = 33

export const encodePositionUpdate = (
  playerId: string,
  x: number,
  y: number,
  z: number,
  rotation: number,
): ArrayBuffer => {
  const buffer = new ArrayBuffer(POSITION_UPDATE_SIZE)
  const view = new DataView(buffer)
  const encoder = new TextEncoder()

  // Message type: 0x01 = position update
  view.setUint8(0, 0x01)

  // Player ID (16 bytes UUID)
  const idBytes = encoder.encode(playerId.replace(/-/g, ""))
  new Uint8Array(buffer, 1, 16).set(idBytes.subarray(0, 16))

  // Position
  view.setFloat32(17, x, true)
  view.setFloat32(21, y, true)
  view.setFloat32(25, z, true)
  view.setFloat32(29, rotation, true)

  return buffer
}

export const decodePositionUpdate = (
  buffer: ArrayBuffer,
): { playerId: string; x: number; y: number; z: number; rotation: number } | null => {
  if (buffer.byteLength < POSITION_UPDATE_SIZE) return null

  const view = new DataView(buffer)
  const decoder = new TextDecoder()

  if (view.getUint8(0) !== 0x01) return null

  const idBytes = new Uint8Array(buffer, 1, 16)
  const playerId = decoder.decode(idBytes)

  return {
    playerId,
    x: view.getFloat32(17, true),
    y: view.getFloat32(21, true),
    z: view.getFloat32(25, true),
    rotation: view.getFloat32(29, true),
  }
}
