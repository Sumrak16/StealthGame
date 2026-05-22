import * as THREE from 'three'

const SOUND_LABELS = {
  clock: 'Часы',
  aquarium: 'Аквариум',
  parrot: 'Попугай',
  camera: 'Камера',
  'creaky-floor': 'Скрип пола',
  'front-door': 'Дверь',
}

export class PreviewGuidanceSystem {
  constructor(scene, soundSources) {
    this.scene = scene
    this.soundSources = soundSources
    this.group = new THREE.Group()
    this.group.visible = false
    this.clock = 0

    this.reticle = this.createReticle()
    this.group.add(this.reticle)

    this.indicators = soundSources.map((source) => this.createSoundIndicator(source))
    for (const indicator of this.indicators) {
      this.group.add(indicator.group)
    }

    this.scene.add(this.group)
  }

  createReticle() {
    const group = new THREE.Group()

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x7ad7ff,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    })

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.42, 48),
      ringMaterial
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.08
    group.add(ring)

    const lineMaterial = ringMaterial.clone()
    lineMaterial.opacity = 0.62
    const lineGeometry = new THREE.BoxGeometry(1.1, 0.025, 0.025)
    const lineA = new THREE.Mesh(lineGeometry, lineMaterial)
    const lineB = new THREE.Mesh(lineGeometry, lineMaterial)
    lineA.position.y = 0.09
    lineB.position.y = 0.1
    lineB.rotation.y = Math.PI / 2
    group.add(lineA, lineB)

    return group
  }

  createSoundIndicator(source) {
    const group = new THREE.Group()
    group.position.set(source.position.x, 0.12, source.position.z)

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x4fe9ff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    })

    const ring = new THREE.Mesh(new THREE.RingGeometry(0.65, 0.82, 48), ringMaterial)
    ring.rotation.x = -Math.PI / 2
    group.add(ring)

    const icon = this.createLabelSprite(SOUND_LABELS[source.label] ?? source.label)
    icon.position.set(0, 1.25, 0)
    group.add(icon)

    return {
      source,
      group,
      ring,
      ringMaterial,
      icon,
      iconMaterial: icon.material,
    }
  }

  createLabelSprite(text) {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 96
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(4, 10, 16, 0.82)'
    ctx.strokeStyle = 'rgba(122, 215, 255, 0.95)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(8, 18, 240, 56, 12)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#dff8ff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 128, 46)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(1.8, 0.68, 1)
    return sprite
  }

  show() {
    this.group.visible = true
  }

  hide() {
    this.group.visible = false
  }

  update(target, deltaTime) {
    if (!this.group.visible) return

    this.clock += deltaTime
    this.reticle.position.set(target.x, 0, target.z)
    this.reticle.rotation.y = Math.sin(this.clock * 2.8) * 0.08

    for (const indicator of this.indicators) {
      const dx = target.x - indicator.source.position.x
      const dz = target.z - indicator.source.position.z
      const distance = Math.hypot(dx, dz)
      const proximity = THREE.MathUtils.clamp(1 - distance / 5.5, 0, 1)
      const pulse = 0.5 + Math.sin(this.clock * 5 + distance) * 0.5
      const opacity = 0.12 + proximity * 0.58 + pulse * proximity * 0.2

      indicator.group.visible = proximity > 0.05
      indicator.ring.scale.setScalar(1 + proximity * 0.55 + pulse * 0.12)
      indicator.ringMaterial.opacity = opacity
      indicator.iconMaterial.opacity = proximity > 0.45 ? THREE.MathUtils.clamp((proximity - 0.45) * 1.8, 0, 1) : 0
      indicator.icon.position.y = 1.15 + pulse * 0.12
    }
  }

  destroy() {
    this.scene.remove(this.group)

    this.group.traverse((object) => {
      if (object.geometry) object.geometry.dispose()
      if (object.material) {
        if (object.material.map) object.material.map.dispose()
        object.material.dispose()
      }
    })
  }
}
