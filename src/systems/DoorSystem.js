export class DoorSystem {
  constructor(doors = [], audioManager = null, interactRadius = 1.35) {
    this.doors = doors
    this.audioManager = audioManager
    this.interactRadius = interactRadius
  }

  update(player, input, deltaTime = 0) {
    this.updateDoorAnimations(deltaTime)

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
    door.userData.isOpening = true
    door.userData.openProgress = door.userData.openProgress ?? 0
    this.audioManager?.playDoorOpen()
  }

  updateDoorAnimations(deltaTime) {
    for (const door of this.doors) {
      if (!door.userData.isOpening) continue

      door.userData.openProgress = Math.min(
        1,
        (door.userData.openProgress ?? 0) + deltaTime * 2.4
      )

      const visual = door.userData.visual
      if (visual) {
        const t = door.userData.openProgress
        const eased = 1 - Math.pow(1 - t, 3)
        const closedRotation = door.userData.closedRotation ?? 0
        const openRotation = door.userData.openRotation ?? closedRotation - Math.PI / 2
        visual.rotation.y = closedRotation + (openRotation - closedRotation) * eased
      } else {
        door.visible = false
      }

      if (door.userData.openProgress >= 1) {
        door.userData.isOpening = false
      }
    }
  }
}
