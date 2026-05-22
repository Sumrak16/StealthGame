import * as THREE from 'three'

export class CollisionSystem {
  constructor(walls) {
    this.walls = walls
    this.playerSize = new THREE.Vector3(0.72, 1, 0.72)
  }

  getCollisionBox(object) {
    const size = object.userData.collisionSize

    if (size) {
      return new THREE.Box3().setFromCenterAndSize(
        object.position.clone(),
        size.clone()
      )
    }

    return new THREE.Box3().setFromObject(object)
  }

  canMoveTo(position) {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      position.clone(),
      this.playerSize
    )

    for (const wall of this.walls) {
      const wallBox = this.getCollisionBox(wall)

      if (playerBox.intersectsBox(wallBox)) {
        return false
      }
    }

    return true
  }
}
