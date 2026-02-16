import { type Position, distanceBetween, createPosition } from "@domain/entities/position"

interface PendingInput {
  readonly sequence: number
  readonly dx: number
  readonly dz: number
  readonly predictedPosition: Position
}

const RECONCILIATION_THRESHOLD = 3.0

export class ClientPrediction {
  private inputSequence = 0
  private pendingInputs: PendingInput[] = []

  recordInput(
    currentPosition: Position,
    dx: number,
    dz: number,
    speed: number,
    dt: number,
  ): { predictedPosition: Position; sequence: number } {
    const seq = this.inputSequence++
    const predictedPosition = createPosition(
      currentPosition.x + dx * speed * dt,
      currentPosition.y,
      currentPosition.z + dz * speed * dt,
      currentPosition.rotation,
    )

    this.pendingInputs.push({
      sequence: seq,
      dx,
      dz,
      predictedPosition,
    })

    // Trim old inputs
    if (this.pendingInputs.length > 120) {
      this.pendingInputs = this.pendingInputs.slice(-60)
    }

    return { predictedPosition, sequence: seq }
  }

  reconcile(
    serverPosition: Position,
    lastProcessedSeq: number,
  ): { needsCorrection: boolean; correctedPosition: Position } {
    // Drop acknowledged inputs
    this.pendingInputs = this.pendingInputs.filter(
      (p) => p.sequence > lastProcessedSeq,
    )

    const currentPredicted =
      this.pendingInputs.length > 0
        ? this.pendingInputs[this.pendingInputs.length - 1]!.predictedPosition
        : serverPosition

    const delta = distanceBetween(currentPredicted, serverPosition)

    if (delta > RECONCILIATION_THRESHOLD) {
      return { needsCorrection: true, correctedPosition: serverPosition }
    }

    return { needsCorrection: false, correctedPosition: currentPredicted }
  }
}
