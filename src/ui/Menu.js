export class Menu {
  constructor(onStart) {
    this.onStart = onStart

    this.overlay = document.createElement('div')
    this.overlay.style.position = 'fixed'
    this.overlay.style.top = '0'
    this.overlay.style.left = '0'
    this.overlay.style.width = '100%'
    this.overlay.style.height = '100%'
    this.overlay.style.display = 'flex'
    this.overlay.style.alignItems = 'center'
    this.overlay.style.justifyContent = 'center'
    this.overlay.style.background = 'rgba(0, 0, 0, 0.75)'
    this.overlay.style.zIndex = '2000'
    this.overlay.style.fontFamily = 'Arial, sans-serif'

    this.panel = document.createElement('div')
    this.panel.style.display = 'flex'
    this.panel.style.flexDirection = 'column'
    this.panel.style.alignItems = 'center'
    this.panel.style.gap = '20px'
    this.panel.style.padding = '40px 50px'
    this.panel.style.background = 'rgba(25, 25, 35, 0.95)'
    this.panel.style.border = '2px solid #666'
    this.panel.style.borderRadius = '10px'
    this.panel.style.boxShadow = '0 0 30px rgba(0,0,0,0.4)'

    this.title = document.createElement('div')
    this.title.textContent = 'BANK SHADOW'
    this.title.style.color = 'white'
    this.title.style.fontSize = '40px'
    this.title.style.fontWeight = 'bold'
    this.title.style.letterSpacing = '2px'

    this.subtitle = document.createElement('div')
    this.subtitle.textContent = 'Стелс-игра с видом сверху'
    this.subtitle.style.color = '#cccccc'
    this.subtitle.style.fontSize = '18px'

    this.startButton = document.createElement('button')
    this.startButton.textContent = 'Начать ограбление'
    this.startButton.style.padding = '14px 28px'
    this.startButton.style.fontSize = '20px'
    this.startButton.style.fontWeight = 'bold'
    this.startButton.style.cursor = 'pointer'
    this.startButton.style.border = 'none'
    this.startButton.style.borderRadius = '8px'
    this.startButton.style.background = '#4caf50'
    this.startButton.style.color = 'white'

    this.hint = document.createElement('div')
    this.hint.textContent = 'Осмотр: WASD двигает камеру. Темнота: WASD двигает игрока, Пробел - сдаться.'
    this.hint.style.color = '#aaaaaa'
    this.hint.style.fontSize = '16px'
    this.hint.style.maxWidth = '460px'
    this.hint.style.textAlign = 'center'
    this.hint.style.lineHeight = '1.35'

    this.startButton.addEventListener('click', () => {
      this.hide()
      this.onStart()
    })

    this.panel.appendChild(this.title)
    this.panel.appendChild(this.subtitle)
    this.panel.appendChild(this.startButton)
    this.panel.appendChild(this.hint)
    this.overlay.appendChild(this.panel)
    document.body.appendChild(this.overlay)
  }

  show() {
    this.overlay.style.display = 'flex'
  }

  hide() {
    this.overlay.style.display = 'none'
  }
}
