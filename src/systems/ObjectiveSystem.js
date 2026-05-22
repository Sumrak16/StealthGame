export class ObjectiveSystem {
  constructor(pickupRadius = 0.8) {
    this.pickupRadius = pickupRadius
  }

  canCollect(player, objective) {
    if (objective.isCollected) return false

    const playerPos = player.mesh.position
    const objectivePos = objective.mesh.position

    const dx = playerPos.x - objectivePos.x
    const dz = playerPos.z - objectivePos.z
    const distance = Math.sqrt(dx * dx + dz * dz)

    return distance <= this.pickupRadius
  }
}