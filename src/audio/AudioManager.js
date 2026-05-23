import * as THREE from 'three'

const FOOTSTEP_URLS = [
  '/assets/audio/footsteps/step_lth1.ogg',
  '/assets/audio/footsteps/step_lth2.ogg',
  '/assets/audio/footsteps/step_lth33.ogg',
  '/assets/audio/footsteps/step_lth4.ogg',
]

const SOUND_PROFILES = {
  clock: { url: '/assets/audio/ambience/clock.wav', frequency: 420, interval: 1, volume: 0.16, refDistance: 0.8, maxDistance: 5.5 },
  twinkle: { url: '/assets/audio/ambience/clock.wav', frequency: 420, interval: 1, volume: 0.12, refDistance: 0.8, maxDistance: 5.5 },
  aquarium: { url: '/assets/audio/ambience/aquarium.ogg', frequency: 180, interval: 1.5, volume: 0.22, refDistance: 0.9, maxDistance: 5.5 },
  parrot: { url: '/assets/audio/ambience/parrot.ogg', frequency: 560, interval: 1.9, volume: 0.24, refDistance: 0.9, maxDistance: 5 },
  camera: { url: '/assets/audio/ambience/camera.ogg', frequency: 780, interval: 1.2, volume: 0.16, refDistance: 0.8, maxDistance: 5 },
  'creaky-floor': { url: '/assets/audio/ambience/creaky-floor.ogg', frequency: 260, interval: 2.3, volume: 0.2, refDistance: 0.85, maxDistance: 5 },
  'front-door': { ambient: false },
}

export class AudioManager {
  constructor(camera) {
    this.listener = new THREE.AudioListener()
    camera.add(this.listener)

    this.loader = new THREE.AudioLoader()
    this.footstepBuffers = []
    this.footstepAudio = new THREE.Audio(this.listener)
    this.footstepCooldown = 0
    this.sources = []
    this.sourcesActive = false
    this.guardAudio = null
    this.alarmAudio = new THREE.Audio(this.listener)
    this.doorAudio = new THREE.Audio(this.listener)
    this.enabled = false

    this.loadFootsteps()
    this.loadAlarm()
    this.loadDoor()
  }

  attachListener(target) {
    target.add(this.listener)
  }

  async resume() {
    const context = this.listener.context
    if (context.state !== 'running') {
      await context.resume()
    }
    this.enabled = true
  }

  loadFootsteps() {
    for (const url of FOOTSTEP_URLS) {
      this.loader.load(url, (buffer) => {
        this.footstepBuffers.push(buffer)
      })
    }
  }

  attachSoundSources(soundSources) {
    this.detachSoundSources()

    for (const soundSource of soundSources) {
      const profile = SOUND_PROFILES[soundSource.label]
      if (!profile || profile.ambient === false) continue

      const audio = new THREE.PositionalAudio(this.listener)
      audio.setLoop(true)
      audio.setVolume(profile.volume)
      audio.setRefDistance(profile.refDistance)
      audio.setMaxDistance(profile.maxDistance)
      audio.setRolloffFactor(3)
      audio.panner.distanceModel = 'linear'
      soundSource.object.add(audio)

      this.sources.push(audio)
      this.loadAmbienceBuffer(soundSource.label, profile, audio)
    }
  }

  attachGuard(enemyMesh) {
    if (this.guardAudio) {
      if (this.guardAudio.isPlaying) this.guardAudio.stop()
      this.guardAudio.removeFromParent()
    }

    this.guardAudio = new THREE.PositionalAudio(this.listener)
    this.guardAudio.setLoop(true)
    this.guardAudio.setVolume(0.24)
    this.guardAudio.setRefDistance(2.4)
    this.guardAudio.setMaxDistance(10)
    this.guardAudio.setRolloffFactor(2)
    enemyMesh.add(this.guardAudio)

    this.loader.load('/assets/audio/guard/guard-step.ogg', (buffer) => {
      this.guardAudio.setBuffer(buffer)
      if (this.sourcesActive && this.enabled && !this.guardAudio.isPlaying) {
        this.guardAudio.play()
      }
    })
  }

  startSoundSources() {
    if (!this.enabled) return

    this.sourcesActive = true

    for (const audio of this.sources) {
      if (audio.buffer && !audio.isPlaying) {
        audio.play()
      }
    }

    if (this.guardAudio?.buffer && !this.guardAudio.isPlaying) {
      this.guardAudio.play()
    }
  }

  stopSoundSources() {
    this.sourcesActive = false

    for (const audio of this.sources) {
      if (audio.isPlaying) audio.stop()
    }

    if (this.guardAudio?.isPlaying) {
      this.guardAudio.stop()
    }
  }

  detachSoundSources() {
    this.stopSoundSources()

    for (const audio of this.sources) {
      audio.removeFromParent()
    }

    if (this.guardAudio) {
      this.guardAudio.removeFromParent()
      this.guardAudio = null
    }

    this.sources = []
  }

  loadAmbienceBuffer(label, profile, audio) {
    const url = profile.url ?? `/assets/audio/ambience/${label}.ogg`
    this.loader.load(
      url,
      (buffer) => {
        audio.setBuffer(buffer)
        if (this.sourcesActive && this.enabled && !audio.isPlaying) {
          audio.play()
        }
      },
      undefined,
      () => {
        audio.setBuffer(this.createPulseBuffer(profile.frequency, profile.interval))
        if (this.sourcesActive && this.enabled && !audio.isPlaying) {
          audio.play()
        }
      }
    )
  }

  loadAlarm() {
    this.loader.load('/assets/audio/ambience/alarm.mp3', (buffer) => {
      this.alarmAudio.setBuffer(buffer)
      this.alarmAudio.setLoop(true)
      this.alarmAudio.setVolume(0.65)
    })
  }

  loadDoor() {
    this.loader.load('/assets/audio/ambience/front-door.ogg', (buffer) => {
      this.doorAudio.setBuffer(buffer)
      this.doorAudio.setVolume(0.55)
    })
  }

  playAlarm() {
    if (!this.enabled || !this.alarmAudio.buffer || this.alarmAudio.isPlaying) {
      return
    }

    this.alarmAudio.play()
  }

  stopAlarm() {
    if (this.alarmAudio.isPlaying) {
      this.alarmAudio.stop()
    }
  }

  playDoorOpen() {
    if (!this.enabled || !this.doorAudio.buffer) return

    if (this.doorAudio.isPlaying) {
      this.doorAudio.stop()
    }

    this.doorAudio.play()
  }

  update(deltaTime, playerMoved) {
    this.footstepCooldown = Math.max(0, this.footstepCooldown - deltaTime)

    if (!this.enabled || !playerMoved || this.footstepCooldown > 0) {
      return
    }

    this.playFootstep()
    this.footstepCooldown = 0.34
  }

  playFootstep() {
    if (this.footstepBuffers.length === 0) return

    if (this.footstepAudio.isPlaying) {
      this.footstepAudio.stop()
    }

    const index = Math.floor(Math.random() * this.footstepBuffers.length)
    this.footstepAudio.setBuffer(this.footstepBuffers[index])
    this.footstepAudio.setVolume(0.42)
    this.footstepAudio.play()
  }

  createPulseBuffer(frequency, interval) {
    const context = this.listener.context
    const sampleRate = context.sampleRate
    const length = Math.floor(sampleRate * interval)
    const buffer = context.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)
    const pulseLength = Math.floor(sampleRate * 0.14)

    for (let i = 0; i < pulseLength; i++) {
      const t = i / sampleRate
      const fade = 1 - i / pulseLength
      data[i] = Math.sin(Math.PI * 2 * frequency * t) * fade * 0.28
    }

    return buffer
  }

  destroy() {
    this.detachSoundSources()
    this.stopAlarm()
    this.listener.removeFromParent()
  }
}
