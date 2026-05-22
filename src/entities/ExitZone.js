import { createExitZoneVisual } from '../assets/VisualFactory'

export class ExitZone {
  constructor(x = 0, z = 0, width = 1.5, depth = 1.5) {
    this.mesh = createExitZoneVisual(width, depth)
    this.mesh.position.set(x, 0, z)

    this.width = width
    this.depth = depth
  }
}
