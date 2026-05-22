import * as THREE from 'three'
import { createPlayerVisual } from '../assets/VisualFactory'

export class Player {
  constructor() {
    this.mesh = createPlayerVisual()
    this.mesh.position.y = 0.5

    this.speed = 0.08
  }

  update(input, collisionSystem) {
    const moveDirection = new THREE.Vector3(0, 0, 0)

    if (input.isKeyDown('w')) moveDirection.z -= 1
    if (input.isKeyDown('s')) moveDirection.z += 1
    if (input.isKeyDown('a')) moveDirection.x -= 1
    if (input.isKeyDown('d')) moveDirection.x += 1

    if (moveDirection.lengthSq() === 0) return false

    moveDirection.normalize()

    const currentPosition = this.mesh.position.clone()

    const nextX = currentPosition.clone()
    nextX.x += moveDirection.x * this.speed

    const nextZ = currentPosition.clone()
    nextZ.z += moveDirection.z * this.speed

    let moved = false

    if (collisionSystem.canMoveTo(nextX)) {
      this.mesh.position.x = nextX.x
      moved = true
    }

    if (collisionSystem.canMoveTo(nextZ)) {
      this.mesh.position.z = nextZ.z
      moved = true
    }

    if (moved) {
      const targetRotation = Math.atan2(moveDirection.x, moveDirection.z)
      this.mesh.rotation.y = targetRotation
    }

    return moved
  }
}
