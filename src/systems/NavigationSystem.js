import * as THREE from 'three'

export class NavigationSystem {
  constructor(walls, navigationPoints = []) {
    this.walls = walls
    this.navigationPoints = navigationPoints
    this.raycaster = new THREE.Raycaster()
  }

  hasLineOfSight(from, to) {
    const direction = new THREE.Vector3().subVectors(to, from)
    const distance = direction.length()

    if (distance === 0) return true

    direction.normalize()
    this.raycaster.set(from.clone(), direction)

    const intersects = this.raycaster.intersectObjects(this.walls, false)

    if (intersects.length === 0) return true
    return intersects[0].distance > distance
  }

  findBestIntermediatePoint(from, to) {
    const fromPos = from.clone()
    const toPos = to.clone()

    let bestPoint = null
    let bestScore = Infinity

    for (const point of this.navigationPoints) {
      const navPoint = new THREE.Vector3(point.x, 0.5, point.z)

      const visibleFromStart = this.hasLineOfSight(fromPos, navPoint)
      const visibleToTarget = this.hasLineOfSight(navPoint, toPos)

      if (!visibleFromStart || !visibleToTarget) continue

      const score =
        fromPos.distanceTo(navPoint) +
        navPoint.distanceTo(toPos)

      if (score < bestScore) {
        bestScore = score
        bestPoint = navPoint
      }
    }

    return bestPoint
  }
}