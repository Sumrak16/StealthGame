import * as THREE from 'three'
import { createEnemyVisual, tintVisual } from '../assets/VisualFactory'

export class Enemy {
  constructor(x = 0, z = 0, patrolPoints = []) {
    this.mesh = createEnemyVisual()
    this.mesh.position.set(x, 0.5, z)

    this.speed = 0.03
    this.chaseSpeed = 0.05
    this.returnSpeed = 0.04

    this.patrolPoints = patrolPoints
    this.currentPatrolIndex = 0

    this.state = 'PATROL'

    this.normalColor = 0xff3333
    this.suspiciousColor = 0xff8800
    this.alertColor = 0xffff00
    this.returnColor = 0x66ccff

    this.detectionLevel = 0
    this.maxDetectionLevel = 100
    this.detectionIncreaseSpeed = 1.2
    this.detectionDecreaseSpeed = 0.8

    this.canCurrentlySeePlayer = false
    this.currentIntermediateTarget = null
  }

  update(collisionSystem, player, navigationSystem) {
    if (this.state === 'PATROL') {
      this.updatePatrol(collisionSystem)
    }

    if (this.state === 'ALERT') {
      this.updateChase(collisionSystem, player, navigationSystem)
    }

    if (this.state === 'RETURN') {
      this.updateReturn(collisionSystem, navigationSystem)
    }
  }

  moveTowards(targetPosition, moveSpeed, collisionSystem) {
    const direction = targetPosition.clone().sub(this.mesh.position)
    direction.y = 0

    const distance = direction.length()
    if (distance < 0.05) return true

    direction.normalize()

    const currentPosition = this.mesh.position.clone()

    const nextX = currentPosition.clone()
    nextX.x += direction.x * moveSpeed

    const nextZ = currentPosition.clone()
    nextZ.z += direction.z * moveSpeed

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
      this.mesh.rotation.y = Math.atan2(direction.x, direction.z)
    }

    return this.mesh.position.distanceTo(targetPosition) < 0.25
  }

  getNearestPatrolPointIndex() {
    let bestIndex = 0
    let bestDistance = Infinity

    for (let i = 0; i < this.patrolPoints.length; i++) {
      const point = this.patrolPoints[i]
      const dx = point.x - this.mesh.position.x
      const dz = point.z - this.mesh.position.z
      const dist = dx * dx + dz * dz

      if (dist < bestDistance) {
        bestDistance = dist
        bestIndex = i
      }
    }

    return bestIndex
  }

  updatePatrol(collisionSystem) {
    if (this.patrolPoints.length === 0) return

    const target = this.patrolPoints[this.currentPatrolIndex]
    const targetPosition = new THREE.Vector3(target.x, 0.5, target.z)

    const reached = this.moveTowards(targetPosition, this.speed, collisionSystem)

    if (reached) {
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length
    }
  }

  updateChase(collisionSystem, player, navigationSystem) {
    if (!this.canCurrentlySeePlayer) {
      this.currentPatrolIndex = this.getNearestPatrolPointIndex()
      this.currentIntermediateTarget = null
      this.setState('RETURN')
      return
    }

    const playerPos = player.mesh.position.clone()
    playerPos.y = 0.5

    if (navigationSystem.hasLineOfSight(this.mesh.position, playerPos)) {
      this.currentIntermediateTarget = null
      this.moveTowards(playerPos, this.chaseSpeed, collisionSystem)
      return
    }

    if (!this.currentIntermediateTarget) {
      this.currentIntermediateTarget = navigationSystem.findBestIntermediatePoint(
        this.mesh.position,
        playerPos
      )
    }

    if (this.currentIntermediateTarget) {
      const reachedIntermediate = this.moveTowards(
        this.currentIntermediateTarget,
        this.chaseSpeed,
        collisionSystem
      )

      if (reachedIntermediate) {
        this.currentIntermediateTarget = null
      }
    }
  }

  updateReturn(collisionSystem, navigationSystem) {
    if (this.patrolPoints.length === 0) return

    const target = this.patrolPoints[this.currentPatrolIndex]
    const patrolTarget = new THREE.Vector3(target.x, 0.5, target.z)

    if (navigationSystem.hasLineOfSight(this.mesh.position, patrolTarget)) {
      this.currentIntermediateTarget = null
      const reachedPatrol = this.moveTowards(
        patrolTarget,
        this.returnSpeed,
        collisionSystem
      )

      if (reachedPatrol) {
        this.setState('PATROL')
      }

      return
    }

    if (!this.currentIntermediateTarget) {
      this.currentIntermediateTarget = navigationSystem.findBestIntermediatePoint(
        this.mesh.position,
        patrolTarget
      )
    }

    if (this.currentIntermediateTarget) {
      const reachedIntermediate = this.moveTowards(
        this.currentIntermediateTarget,
        this.returnSpeed,
        collisionSystem
      )

      if (reachedIntermediate) {
        this.currentIntermediateTarget = null
      }
    } else {
      this.setState('PATROL')
    }
  }

  updateDetection(seeingPlayer) {
    this.canCurrentlySeePlayer = seeingPlayer

    if (this.state === 'ALERT') {
      this.setVisualColor(this.alertColor)
      return
    }

    if (this.state === 'RETURN') {
      this.setVisualColor(this.returnColor)
      return
    }

    if (seeingPlayer) {
      this.detectionLevel += this.detectionIncreaseSpeed
    } else {
      this.detectionLevel -= this.detectionDecreaseSpeed
    }

    this.detectionLevel = Math.max(0, Math.min(this.detectionLevel, this.maxDetectionLevel))

    if (this.detectionLevel >= this.maxDetectionLevel) {
      this.currentIntermediateTarget = null
      this.setState('ALERT')
      return
    }

    if (this.detectionLevel > 0) {
      this.setVisualColor(this.suspiciousColor)
    } else {
      this.setVisualColor(this.normalColor)
      this.setState('PATROL')
    }
  }

  setVisualColor(color) {
    tintVisual(this.mesh, color)
  }

  setState(newState) {
    this.state = newState

    if (this.state === 'PATROL') {
      this.setVisualColor(this.normalColor)
      this.detectionLevel = 0
      this.currentIntermediateTarget = null
    }

    if (this.state === 'ALERT') {
      this.setVisualColor(this.alertColor)
      this.detectionLevel = this.maxDetectionLevel
    }

    if (this.state === 'RETURN') {
      this.setVisualColor(this.returnColor)
      this.detectionLevel = 0
    }
  }
}
