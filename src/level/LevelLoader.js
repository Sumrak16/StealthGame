import * as THREE from 'three'
import { addWallDetails } from '../assets/VisualFactory'

export class LevelLoader {
  constructor(scene, assetManager = null) {
    this.scene = scene
    this.assetManager = assetManager
    this.walls = []
    this.objects = []
    this.soundSources = []
    this.alarmZones = []
    this.doors = []

    this.patrolPoints = []
    this.navigationPoints = []
    this.currentLevel = null

    this.floorTexture = this.createFloorTexture()
    this.wallTexture = this.createWallTexture()
  }

  createFloorTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#5b5f68'
    ctx.fillRect(0, 0, 256, 256)

    const tileSize = 64
    for (let y = 0; y < 256; y += tileSize) {
      for (let x = 0; x < 256; x += tileSize) {
        ctx.fillStyle = (x / tileSize + y / tileSize) % 2 === 0 ? '#666b75' : '#555961'
        ctx.fillRect(x, y, tileSize, tileSize)

        ctx.strokeStyle = 'rgba(0,0,0,0.15)'
        ctx.lineWidth = 2
        ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2)
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 256; i += tileSize) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 256)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(256, i)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(8, 8)
    texture.anisotropy = 8

    return texture
  }

  createWallTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#8d929b'
    ctx.fillRect(0, 0, 256, 256)

    for (let x = 0; x < 256; x += 32) {
      ctx.fillStyle = x % 64 === 0 ? '#9aa0aa' : '#858b95'
      ctx.fillRect(x, 0, 32, 256)

      ctx.strokeStyle = 'rgba(0,0,0,0.18)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 256)
      ctx.stroke()
    }

    ctx.fillStyle = 'rgba(255,255,255,0.10)'
    ctx.fillRect(0, 40, 256, 8)
    ctx.fillRect(0, 120, 256, 6)
    ctx.fillRect(0, 210, 256, 8)

    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.lineWidth = 1
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(256, y)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 1)
    texture.anisotropy = 8

    return texture
  }

  createFloor(width = 20, depth = 20) {
    const floorGeometry = new THREE.PlaneGeometry(width, depth)
    const floorMaterial = this.assetManager?.createFloorMaterial() ?? new THREE.MeshStandardMaterial({
        map: this.floorTexture,
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.05,
      })

    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true

    this.scene.add(floor)
    this.objects.push(floor)

    return floor
  }

  createWall(x, y, z, width, height, depth, color = 0xffffff) {
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const repeatX = Math.max(1, Math.round(Math.max(width, depth) / 2))
    const material = this.assetManager?.createWallMaterial(repeatX) ?? (() => {
      const texture = this.wallTexture.clone()
      texture.needsUpdate = true
      texture.repeat.set(repeatX, 1)

      return new THREE.MeshStandardMaterial({
        map: texture,
        color,
        roughness: 0.85,
        metalness: 0.08,
      })
    })()

    const wall = new THREE.Mesh(geometry, material)
    wall.position.set(x, y, z)
    wall.castShadow = true
    wall.receiveShadow = true
    wall.userData.collisionSize = new THREE.Vector3(width, height, depth)
    addWallDetails(wall, width, height, depth)

    this.scene.add(wall)
    this.walls.push(wall)
    this.objects.push(wall)

    return wall
  }

  createMarker(x, z, width, depth, color, emissive = 0x000000) {
    const geometry = new THREE.BoxGeometry(width, 0.06, depth)
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive,
      roughness: 0.55,
      metalness: 0.05,
    })

    const marker = new THREE.Mesh(geometry, material)
    marker.position.set(x, 0.035, z)
    marker.receiveShadow = true

    this.scene.add(marker)
    this.objects.push(marker)

    return marker
  }

  createAlarmPlate(x, z, width, depth) {
    const plate = this.createMarker(x, z, width, depth, 0x4a1515, 0x6d0808)
    plate.userData.alarmZone = true
    this.alarmZones.push({ x, z, width, depth, plate })
    return plate
  }

  createDoor(x, z, width, depth, rotation = 0) {
    const doorHeight = 2.05
    const door = this.createProp(x, z, width, doorHeight, depth, 0x8a5a22, true)
    door.rotation.y = rotation
    door.userData.isDoor = true
    door.userData.isOpen = false
    door.userData.openProgress = 0
    door.userData.closedRotation = rotation
    door.userData.openRotation = rotation - Math.PI / 2
    door.userData.visualWidth = width

    if (Math.abs(Math.sin(rotation)) > 0.5) {
      door.userData.collisionSize = new THREE.Vector3(depth, doorHeight, width)
    }

    this.attachDoorModel(door, { x: width, y: doorHeight, z: Math.max(depth, 0.5) }, rotation)

    this.doors.push(door)
    return door
  }

  attachDoorModel(door, targetSize, rotation) {
    if (!this.assetManager) return

    this.assetManager.createModel('/assets/models/doors/door.glb', targetSize, { uniform: false })
      .then((model) => {
        if (!model) return

        const hingeOffset = new THREE.Vector3(-targetSize.x / 2, 0, 0)
        hingeOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation)

        const pivot = new THREE.Group()
        pivot.position.set(
          door.position.x + hingeOffset.x,
          0,
          door.position.z + hingeOffset.z
        )
        pivot.rotation.y = rotation

        model.position.x += targetSize.x / 2
        pivot.add(model)

        door.userData.visual = pivot
        door.userData.closedRotation = rotation
        door.userData.openRotation = rotation - Math.PI / 2
        this.scene.add(pivot)
        this.objects.push(pivot)
        door.visible = false
      })
      .catch(() => {
        door.visible = true
      })
  }

  createSoundObject(x, z, width, depth, color, label, emissive = 0x000000) {
    const hiddenLabels = new Set(['front-door', 'creaky-floor'])
    const isHidden = hiddenLabels.has(label)
    const object = this.createProp(x, z, width, 0.7, depth, color, false)
    const beacon = isHidden
      ? null
      : this.createMarker(x, z, width + 0.35, depth + 0.35, color, emissive)

    object.visible = false

    if (!isHidden) {
      this.attachSoundObjectModel(object, label, { x: width, y: 0.85, z: depth })
    }

    this.soundSources.push({
      label,
      object,
      beacon,
      position: new THREE.Vector3(x, 0.5, z),
    })

    return object
  }

  attachSoundObjectModel(object, label, targetSize) {
    if (!this.assetManager) return

    this.assetManager.createSoundObjectModel(label, targetSize)
      .then((model) => {
        if (!model) return

        model.position.add(new THREE.Vector3(
          object.position.x,
          this.getSoundModelYOffset(label),
          object.position.z
        ))
        this.scene.add(model)
        this.objects.push(model)
        object.visible = false
      })
      .catch(() => {
        object.visible = false
      })
  }

  getSoundModelYOffset(label) {
    if (label === 'clock' || label === 'twinkle') return 0.85
    return 0
  }

  createProp(x, z, width, height, depth, color, collidable = false) {
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.78,
      metalness: 0.08,
    })

    const prop = new THREE.Mesh(geometry, material)
    prop.position.set(x, height / 2, z)
    prop.castShadow = true
    prop.receiveShadow = true
    prop.userData.collisionSize = new THREE.Vector3(width, height, depth)

    this.scene.add(prop)
    this.objects.push(prop)

    if (collidable) {
      this.walls.push(prop)
    }

    return prop
  }

  createBankDesk(x, z, width = 2.4, rotation = 0) {
    const desk = this.createProp(x, z, width, 0.75, 0.55, 0x56616f, true)
    desk.rotation.y = rotation
    if (Math.abs(Math.sin(rotation)) > 0.5) {
      desk.userData.collisionSize = new THREE.Vector3(0.55, 0.75, width)
    }

    const top = this.createProp(x, z, width + 0.12, 0.08, 0.72, 0x2b323a, false)
    top.position.y = 0.82
    top.rotation.y = rotation

    return desk
  }

  createColumn(x, z) {
    return this.createProp(x, z, 0.75, 1.8, 0.75, 0x7b838d, true)
  }

  loadLevel(levelData) {
    this.currentLevel = levelData
    this.walls = []
    this.objects = []
    this.soundSources = []
    this.alarmZones = []
    this.doors = []
    this.patrolPoints = levelData.enemies?.[0]?.patrolPoints ?? []
    this.navigationPoints = levelData.navigationPoints ?? []

    this.createFloor(levelData.floor?.width, levelData.floor?.depth)

    for (const wall of levelData.walls ?? []) {
      this.createWall(
        wall.x,
        wall.y,
        wall.z,
        wall.width,
        wall.height,
        wall.depth,
        wall.color
      )
    }

    for (const desk of levelData.desks ?? []) {
      this.createBankDesk(desk.x, desk.z, desk.width, desk.rotation ?? 0)
    }

    for (const column of levelData.columns ?? []) {
      this.createColumn(column.x, column.z)
    }

    for (const soundObject of levelData.soundObjects ?? []) {
      this.createSoundObject(
        soundObject.x,
        soundObject.z,
        soundObject.width,
        soundObject.depth,
        soundObject.color,
        soundObject.label,
        soundObject.emissive
      )
    }

    for (const alarmZone of levelData.alarmZones ?? []) {
      this.createAlarmPlate(
        alarmZone.x,
        alarmZone.z,
        alarmZone.width,
        alarmZone.depth
      )
    }

    for (const door of levelData.doors ?? []) {
      this.createDoor(
        door.x,
        door.z,
        door.width,
        door.depth,
        door.rotation ?? 0
      )
    }

    for (const marker of levelData.markers ?? []) {
      this.createMarker(
        marker.x,
        marker.z,
        marker.width,
        marker.depth,
        marker.color,
        marker.emissive
      )
    }
  }
}
