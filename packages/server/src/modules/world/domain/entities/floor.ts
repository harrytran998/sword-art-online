import type { FloorId } from "../../../../shared/kernel/types"

interface FloorProps {
  readonly id: FloorId
  readonly name: string
  readonly recommendedLevel: number
  readonly isUnlocked: boolean
}

export class Floor {
  private constructor(private readonly props: FloorProps) {}

  static create(props: FloorProps): Floor {
    return new Floor(props)
  }

  get id(): FloorId {
    return this.props.id
  }
  get name(): string {
    return this.props.name
  }
  get recommendedLevel(): number {
    return this.props.recommendedLevel
  }
  get isUnlocked(): boolean {
    return this.props.isUnlocked
  }
}
