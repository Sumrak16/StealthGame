export class ExitSystem {
  constructor(exitRadius = 1.0) {
    this.exitRadius = exitRadius
  }

  isPlayerAtExit(player, exitZone) {
    const playerPos = player.mesh.position
    const exitPos = exitZone.mesh.position

    const dx = playerPos.x - exitPos.x
    const dz = playerPos.z - exitPos.z
    const distance = Math.sqrt(dx * dx + dz * dz)

    return distance <= this.exitRadius
  }
}