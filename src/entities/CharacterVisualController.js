import * as THREE from 'three'

export class CharacterVisualController {
  constructor(root, model, animations = []) {
    this.root = root
    this.model = model
    this.animations = animations
    this.mixer = animations.length > 0 ? new THREE.AnimationMixer(model) : null
    this.walkAction = null
    this.idleAction = null
    this.walking = false
    this.time = 0
    this.baseY = model.position.y
    this.baseRotationZ = model.rotation.z

    if (this.mixer) {
      this.setupActions()
    }
  }

  setupActions() {
    const idleClip = this.findClip(['idle', 'stand'])
    const walkClip = this.findClip(['walk', 'run'])

    if (idleClip) {
      this.idleAction = this.mixer.clipAction(idleClip)
      this.idleAction.play()
    }

    if (walkClip) {
      this.walkAction = this.mixer.clipAction(walkClip)
      this.walkAction.enabled = true
      this.walkAction.setEffectiveWeight(0)
      this.walkAction.play()
    }
  }

  findClip(names) {
    return this.animations.find((clip) => {
      const clipName = clip.name.toLowerCase()
      return names.some((name) => clipName.includes(name))
    })
  }

  update(deltaTime, moving) {
    this.time += deltaTime

    if (this.mixer) {
      this.updateMixer(deltaTime, moving)
      return
    }

    this.updateProcedural(deltaTime, moving)
  }

  updateMixer(deltaTime, moving) {
    const fadeSpeed = Math.min(1, deltaTime * 8)
    const walkWeight = moving ? 1 : 0
    const idleWeight = moving ? 0 : 1

    if (this.walkAction) {
      const weight = THREE.MathUtils.lerp(this.walkAction.getEffectiveWeight(), walkWeight, fadeSpeed)
      this.walkAction.setEffectiveWeight(weight)
    }

    if (this.idleAction) {
      const weight = THREE.MathUtils.lerp(this.idleAction.getEffectiveWeight(), idleWeight, fadeSpeed)
      this.idleAction.setEffectiveWeight(weight)
    }

    this.mixer.update(deltaTime)
  }

  updateProcedural(deltaTime, moving) {
    if (!moving) {
      this.model.position.y = THREE.MathUtils.lerp(this.model.position.y, this.baseY, deltaTime * 8)
      this.model.rotation.z = THREE.MathUtils.lerp(this.model.rotation.z, this.baseRotationZ, deltaTime * 8)
      return
    }

    const step = Math.sin(this.time * 12)
    this.model.position.y = this.baseY + Math.abs(step) * 0.055
    this.model.rotation.z = this.baseRotationZ + step * 0.055
  }
}
