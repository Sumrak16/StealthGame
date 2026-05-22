import * as THREE from 'three'

export class DetectionSystem {
  constructor(walls) {
    this.walls = walls
    this.detectionRadius = 7
    this.viewAngle = Math.PI * 0.75
    this.raycaster = new THREE.Raycaster()
  }

  canDetectPlayer(enemy, player) {
    const enemyPosition = enemy.mesh.position.clone()
    const playerPosition = player.mesh.position.clone()

    const toPlayer = new THREE.Vector3(
      playerPosition.x - enemyPosition.x,
      0,
      playerPosition.z - enemyPosition.z
    )

    const distance = toPlayer.length()

    if (distance > this.detectionRadius) {
      return false
    }

    toPlayer.normalize()

    const forward = new THREE.Vector3(0, 0, 1)
    forward.applyQuaternion(enemy.mesh.quaternion)
    forward.y = 0
    forward.normalize()

    const dot = forward.dot(toPlayer)
    const angle = Math.acos(THREE.MathUtils.clamp(dot, -1, 1))

    if (angle > this.viewAngle / 2) {
      return false
    }

    return this.hasLineOfSight(enemyPosition, playerPosition)
  }

  hasLineOfSight(enemyPosition, playerPosition) {
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, enemyPosition)
      .normalize()

    const distanceToPlayer = enemyPosition.distanceTo(playerPosition)

    this.raycaster.set(enemyPosition, direction)

    const intersects = this.raycaster.intersectObjects(this.walls, false)

    if (intersects.length === 0) {
      return true
    }

    return intersects[0].distance > distanceToPlayer
  }
}