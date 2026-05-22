import { GameState } from '../game/GameState'

export class HUD {
  constructor(camera, renderer, enemy) {
    this.camera = camera
    this.renderer = renderer
    this.enemy = enemy

    const oldRoot = document.getElementById('game-hud-root')
    if (oldRoot) {
      oldRoot.remove()
    }

    this.root = document.createElement('div')
    this.root.id = 'game-hud-root'
    document.body.appendChild(this.root)

    this.enemyIndicator = document.createElement('div')
    this.enemyIndicator.style.position = 'absolute'
    this.enemyIndicator.style.color = 'white'
    this.enemyIndicator.style.fontSize = '32px'
    this.enemyIndicator.style.fontWeight = 'bold'
    this.enemyIndicator.style.lineHeight = '1'
    this.enemyIndicator.style.pointerEvents = 'none'
    this.enemyIndicator.style.userSelect = 'none'
    this.enemyIndicator.style.transform = 'translate(-50%, -50%)'
    this.enemyIndicator.style.textShadow = '0 0 6px black'
    this.enemyIndicator.style.display = 'none'
    this.enemyIndicator.style.zIndex = '900'
    this.root.appendChild(this.enemyIndicator)

    this.missionPanel = document.createElement('div')
    this.missionPanel.style.position = 'fixed'
    this.missionPanel.style.top = '20px'
    this.missionPanel.style.left = '20px'
    this.missionPanel.style.width = '360px'
    this.missionPanel.style.padding = '14px 18px'
    this.missionPanel.style.background = 'rgba(0, 0, 0, 0.78)'
    this.missionPanel.style.border = '1px solid rgba(255,255,255,0.18)'
    this.missionPanel.style.borderRadius = '10px'
    this.missionPanel.style.color = 'white'
    this.missionPanel.style.fontFamily = 'Arial, sans-serif'
    this.missionPanel.style.zIndex = '950'
    this.missionPanel.style.pointerEvents = 'none'
    this.missionPanel.style.userSelect = 'none'
    this.missionPanel.style.boxSizing = 'border-box'

    this.missionTitle = document.createElement('div')
    this.missionTitle.textContent = 'ЗАДАЧА'
    this.missionTitle.style.fontSize = '13px'
    this.missionTitle.style.fontWeight = 'bold'
    this.missionTitle.style.letterSpacing = '1px'
    this.missionTitle.style.opacity = '0.85'
    this.missionTitle.style.marginBottom = '10px'
    this.missionTitle.style.lineHeight = '1.2'

    this.objectiveText = document.createElement('div')
    this.objectiveText.style.fontSize = '18px'
    this.objectiveText.style.fontWeight = 'bold'
    this.objectiveText.style.lineHeight = '1.3'
    this.objectiveText.style.marginBottom = '8px'
    this.objectiveText.style.wordBreak = 'break-word'

    this.statusText = document.createElement('div')
    this.statusText.style.fontSize = '15px'
    this.statusText.style.lineHeight = '1.35'
    this.statusText.style.opacity = '0.95'
    this.statusText.style.wordBreak = 'break-word'

    this.missionPanel.appendChild(this.missionTitle)
    this.missionPanel.appendChild(this.objectiveText)
    this.missionPanel.appendChild(this.statusText)
    this.root.appendChild(this.missionPanel)

    this.timerPanel = document.createElement('div')
    this.timerPanel.style.position = 'fixed'
    this.timerPanel.style.top = '20px'
    this.timerPanel.style.left = '50%'
    this.timerPanel.style.transform = 'translateX(-50%)'
    this.timerPanel.style.minWidth = '280px'
    this.timerPanel.style.padding = '12px 18px'
    this.timerPanel.style.background = 'rgba(0, 0, 0, 0.78)'
    this.timerPanel.style.border = '1px solid rgba(255,255,255,0.18)'
    this.timerPanel.style.borderRadius = '10px'
    this.timerPanel.style.color = 'white'
    this.timerPanel.style.fontFamily = 'Arial, sans-serif'
    this.timerPanel.style.textAlign = 'center'
    this.timerPanel.style.zIndex = '950'
    this.timerPanel.style.pointerEvents = 'none'
    this.timerPanel.style.userSelect = 'none'

    this.timerLabel = document.createElement('div')
    this.timerLabel.style.fontSize = '12px'
    this.timerLabel.style.fontWeight = 'bold'
    this.timerLabel.style.letterSpacing = '1px'
    this.timerLabel.style.opacity = '0.85'
    this.timerLabel.style.marginBottom = '4px'

    this.timerValue = document.createElement('div')
    this.timerValue.style.fontSize = '30px'
    this.timerValue.style.fontWeight = 'bold'
    this.timerValue.style.lineHeight = '1.1'

    this.timerPanel.appendChild(this.timerLabel)
    this.timerPanel.appendChild(this.timerValue)
    this.root.appendChild(this.timerPanel)
  }

  update(hasObjective = false, gameState = GameState.PLAYING, previewTimeLeft = 0) {
    this.updateEnemyIndicator(gameState)
    this.updateMissionText(hasObjective, gameState)
    this.updateTimer(gameState, previewTimeLeft)
  }

  hideEnemyIndicator() {
    this.enemyIndicator.style.display = 'none'
  }

  updateEnemyIndicator(gameState) {
    if (gameState !== GameState.PLAYING) {
      this.hideEnemyIndicator()
      return
    }

    if (this.enemy.state === 'ALERT') {
      this.enemyIndicator.textContent = '!'
      this.enemyIndicator.style.display = 'block'
      this.enemyIndicator.style.color = '#ff4d4d'
    } else if (this.enemy.detectionLevel > 0) {
      this.enemyIndicator.textContent = '?'
      this.enemyIndicator.style.display = 'block'
      this.enemyIndicator.style.color = '#ffcc33'
    } else {
      this.hideEnemyIndicator()
      return
    }

    const position = this.enemy.mesh.position.clone()
    position.y += 1.5
    position.project(this.camera)

    const x = (position.x * 0.5 + 0.5) * this.renderer.domElement.clientWidth
    const y = (-position.y * 0.5 + 0.5) * this.renderer.domElement.clientHeight

    this.enemyIndicator.style.left = `${x}px`
    this.enemyIndicator.style.top = `${y}px`
  }

  updateTimer(gameState, previewTimeLeft) {
    if (gameState === GameState.PREVIEW) {
      this.timerPanel.style.display = 'block'
      this.timerLabel.textContent = 'ОСМОТР УРОВНЯ'
      this.timerValue.style.fontSize = '30px'
      this.timerValue.textContent = `${Math.ceil(previewTimeLeft)} сек.`
      return
    }

    if (gameState === GameState.PLAYING) {
      this.timerPanel.style.display = 'block'
      this.timerLabel.textContent = 'СВЕТ ОТКЛЮЧЁН'
      this.timerValue.textContent = 'Пробел - сдаться'
      this.timerValue.style.fontSize = '18px'
      return
    }

    this.timerPanel.style.display = 'none'
    this.timerValue.style.fontSize = '30px'
  }

  updateMissionText(hasObjective, gameState) {
    if (gameState === GameState.PREVIEW) {
      this.objectiveText.textContent = 'Запомните планировку банка'
      this.statusText.textContent = 'WASD двигает камеру осмотра. Через 15 секунд свет погаснет.'
      return
    }

    if (gameState === GameState.VICTORY) {
      this.objectiveText.textContent = 'Побег выполнен'
      this.statusText.textContent = 'Статус: задание завершено'
      return
    }

    if (gameState === GameState.GAME_OVER) {
      this.objectiveText.textContent = 'Задание провалено'
      this.statusText.textContent = 'Статус: попытка завершена'
      return
    }

    if (gameState === GameState.MENU) {
      this.objectiveText.textContent = 'Начните игру'
      this.statusText.textContent = 'Статус: ожидание запуска'
      return
    }

    if (hasObjective) {
      this.objectiveText.textContent = 'Доберитесь до выхода'
      this.statusText.textContent = 'Документ получен. Избегайте охраны.'
    } else {
      this.objectiveText.textContent = 'Найдите секретный документ'
      this.statusText.textContent = 'Документ не найден. Сначала выполните цель.'
    }
  }

  destroy() {
    if (this.root) {
      this.root.remove()
    }
  }
}
