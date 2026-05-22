export class Input {
  constructor() {
    this.keys = {}
    this.justPressed = {}

    window.addEventListener('keydown', (event) => {
      const key = this.normalizeKey(event.key)

      if (key === 'space') {
        event.preventDefault()
      }

      if (!this.keys[key]) {
        this.justPressed[key] = true
      }

      this.keys[key] = true
    })

    window.addEventListener('keyup', (event) => {
      const key = this.normalizeKey(event.key)
      this.keys[key] = false
    })
  }

  normalizeKey(key) {
    if (key === ' ') return 'space'
    return key.toLowerCase()
  }

  isKeyDown(key) {
    return !!this.keys[this.normalizeKey(key)]
  }

  wasKeyPressed(key) {
    key = this.normalizeKey(key)
    if (this.justPressed[key]) {
      this.justPressed[key] = false
      return true
    }
    return false
  }

  clearJustPressed() {
    this.justPressed = {}
  }
}
