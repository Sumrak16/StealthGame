export class AlarmSystem {
  constructor(zones = []) {
    this.zones = zones
    this.triggeredZone = null
  }

  update(player) {
    if (this.triggeredZone) return this.triggeredZone

    const position = player.mesh.position

    for (const zone of this.zones) {
      const halfWidth = zone.width / 2
      const halfDepth = zone.depth / 2
      const insideX = position.x >= zone.x - halfWidth && position.x <= zone.x + halfWidth
      const insideZ = position.z >= zone.z - halfDepth && position.z <= zone.z + halfDepth

      if (insideX && insideZ) {
        this.triggeredZone = zone
        return zone
      }
    }

    return null
  }

  reset() {
    this.triggeredZone = null
  }
}
