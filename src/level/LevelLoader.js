import * as THREE from 'three'
import { addWallDetails } from '../assets/VisualFactory'

export class LevelLoader {
  constructor(scene) {
    this.scene = scene
    this.walls = []
    this.objects = []
    this.soundSources = []

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
    const floorMaterial = new THREE.MeshStandardMaterial({
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
    const texture = this.wallTexture.clone()
    texture.needsUpdate = true
    texture.repeat.set(
      Math.max(1, Math.round(Math.max(width, depth) / 2)),
      1
    )

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color,
      roughness: 0.85,
      metalness: 0.08,
    })

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

  createSoundObject(x, z, width, depth, color, label, emissive = 0x000000) {
    const object = this.createProp(x, z, width, 0.7, depth, color, true)
    const beacon = this.createMarker(x, z, width + 0.35, depth + 0.35, color, emissive)

    this.soundSources.push({
      label,
      object,
      beacon,
      position: new THREE.Vector3(x, 0.5, z),
    })

    return object
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
