export const ObjectiveType = {
  DOCUMENT: 'document',
  KEYCARD: 'keycard',
  TERMINAL: 'terminal',
  SAFE: 'safe',
}

export class ObjectiveSystem {
  constructor(objectiveData, pickupRadius = 0.8) {
    this.objectiveData = objectiveData
    this.pickupRadius = pickupRadius
    this.completed = false
  }

  canInteract(player, objective) {
    if (!objective || objective.isCollected) return false

    const playerPos = player.mesh.position
    const objectivePos = objective.mesh.position

    const dx = playerPos.x - objectivePos.x
    const dz = playerPos.z - objectivePos.z
    const distance = Math.sqrt(dx * dx + dz * dz)

    return distance <= this.pickupRadius
  }

  tryComplete(player, objective, scene) {
    if (this.completed || !this.canInteract(player, objective)) {
      return false
    }

    if (this.objectiveData.type === ObjectiveType.DOCUMENT) {
      objective.collect(scene)
      this.completed = true
      return true
    }

    return false
  }

  isCompleted() {
    return this.completed
  }

  canUseExit() {
    return this.completed
  }

  getMissionText(gameState) {
    if (gameState === 'PREVIEW') {
      return {
        title: this.objectiveData.previewTitle ?? 'Запомните планировку банка',
        status: this.objectiveData.previewStatus ?? 'Изучите маршрут до цели и выхода.',
      }
    }

    if (gameState === 'VICTORY') {
      return {
        title: this.objectiveData.victoryTitle ?? 'Побег выполнен',
        status: this.objectiveData.victoryStatus ?? 'Статус: задание завершено',
      }
    }

    if (gameState === 'GAME_OVER') {
      return {
        title: this.objectiveData.failureTitle ?? 'Задание провалено',
        status: this.objectiveData.failureStatus ?? 'Статус: попытка завершена',
      }
    }

    if (this.completed) {
      return {
        title: this.objectiveData.completedTitle ?? 'Доберитесь до выхода',
        status: this.objectiveData.completedStatus ?? 'Цель выполнена. Найдите выход.',
      }
    }

    return {
      title: this.objectiveData.title ?? 'Выполните цель уровня',
      status: this.objectiveData.pendingStatus ?? 'Сначала выполните основную цель.',
    }
  }
}
