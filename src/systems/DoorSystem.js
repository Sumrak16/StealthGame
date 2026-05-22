export class DoorSystem {
  constructor(doors = [], audioManager = null, interactRadius = 1.35) {
    this.doors = doors
    this.audioManager = audioManager
    this.interactRadius = interactRadius
  }

  update(player, input) {
    if (!input.wasKeyPressed('e')) return

    const door = this.findNearestClosedDoor(player)
    if (!door) return

    this.openDoor(door)
  }

  findNearestClosedDoor(player) {
    const playerPosition = player.mesh.position
    let nearestDoor = null
    let nearestDistance = Infinity

    for (const door of this.doors) {
      if (door.userData.isOpen) continue

      const dx = playerPosition.x - door.position.x
      const dz = playerPosition.z - door.position.z
      const distance = Math.hypot(dx, dz)

      if (distance <= this.interactRadius && distance < nearestDistance) {
        nearestDoor = door
        nearestDistance = distance
      }
    }

    return nearestDoor
  }

  openDoor(door) {
    door.userData.isOpen = true
    door.visible = false
    if (door.userData.visual) {
      door.userData.visual.visible = false
    }
    this.audioManager?.playDoorOpen()
  }
}
