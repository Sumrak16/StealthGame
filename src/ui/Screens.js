export class Screens {
  constructor(onRestart, onMenu) {
    this.onRestart = onRestart
    this.onMenu = onMenu

    this.overlay = document.createElement('div')
    this.overlay.style.position = 'fixed'
    this.overlay.style.top = '0'
    this.overlay.style.left = '0'
    this.overlay.style.width = '100%'
    this.overlay.style.height = '100%'
    this.overlay.style.display = 'none'
    this.overlay.style.alignItems = 'center'
    this.overlay.style.justifyContent = 'center'
    this.overlay.style.flexDirection = 'column'
    this.overlay.style.background = 'rgba(0, 0, 0, 0.68)'
    this.overlay.style.color = 'white'
    this.overlay.style.fontFamily = 'Arial, sans-serif'
    this.overlay.style.zIndex = '1000'
    this.overlay.style.textAlign = 'center'
    this.overlay.style.userSelect = 'none'
    this.overlay.style.boxSizing = 'border-box'
    this.overlay.style.padding = '20px'

    this.title = document.createElement('div')
    this.title.style.fontSize = '48px'
    this.title.style.fontWeight = 'bold'
    this.title.style.marginBottom = '16px'

    this.subtitle = document.createElement('div')
    this.subtitle.style.fontSize = '22px'
    this.subtitle.style.marginBottom = '24px'

    this.actions = document.createElement('div')
    this.actions.style.display = 'flex'
    this.actions.style.gap = '12px'
    this.actions.style.flexWrap = 'wrap'
    this.actions.style.justifyContent = 'center'

    this.restartButton = this.createButton('Заново', () => this.onRestart?.())
    this.menuButton = this.createButton('В меню', () => this.onMenu?.())

    this.actions.appendChild(this.restartButton)
    this.actions.appendChild(this.menuButton)
    this.overlay.appendChild(this.title)
    this.overlay.appendChild(this.subtitle)
    this.overlay.appendChild(this.actions)
    document.body.appendChild(this.overlay)
  }

  createButton(text, onClick) {
    const button = document.createElement('button')
    button.textContent = text
    button.style.padding = '12px 22px'
    button.style.fontSize = '18px'
    button.style.fontWeight = 'bold'
    button.style.cursor = 'pointer'
    button.style.border = 'none'
    button.style.borderRadius = '8px'
    button.style.background = '#4caf50'
    button.style.color = 'white'
    button.addEventListener('click', onClick)
    return button
  }

  showVictory() {
    this.overlay.style.display = 'flex'
    this.title.textContent = 'ПОБЕДА'
    this.subtitle.textContent = 'Документ получен, выход найден. Можно попробовать ещё раз.'
  }

  showGameOver(reason = 'Охрана вас обнаружила.') {
    this.overlay.style.display = 'flex'
    this.title.textContent = 'ПОРАЖЕНИЕ'
    this.subtitle.textContent = reason
  }

  hide() {
    this.overlay.style.display = 'none'
  }
}
