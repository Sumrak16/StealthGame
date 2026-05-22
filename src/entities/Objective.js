import { createObjectiveVisual } from '../assets/VisualFactory'

export class Objective {
  constructor(x = 0, z = 0) {
    this.mesh = createObjectiveVisual()
    this.mesh.position.set(x, 0, z)

    this.isCollected = false
  }

  collect(scene) {
    if (this.isCollected) return

    this.isCollected = true
    scene.remove(this.mesh)
  }
}
