import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { applyShadows } from './VisualFactory'

const MODEL_BY_SOUND_LABEL = {
  clock: '/assets/models/props/twinkle/Twinkle_silver.FBX',
  camera: '/assets/models/scifi/props/Prop_AccessPoint.gltf',
  twinkle: '/assets/models/props/twinkle/Twinkle_silver.FBX',
}

export class AssetManager {
  constructor(renderer) {
    this.renderer = renderer
    this.textureLoader = new THREE.TextureLoader()
    this.gltfLoader = new GLTFLoader()
    this.fbxLoader = new FBXLoader()
    this.textures = new Map()
    this.modelPromises = new Map()
  }

  loadTexture(path, options = {}) {
    if (this.textures.has(path)) {
      return this.textures.get(path)
    }

    const texture = this.textureLoader.load(path)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(options.repeatX ?? 1, options.repeatY ?? 1)
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()

    if (options.color) {
      texture.colorSpace = THREE.SRGBColorSpace
    }

    this.textures.set(path, texture)
    return texture
  }

  createFloorMaterial() {
    return new THREE.MeshStandardMaterial({
      map: this.loadTexture('/assets/textures/floor-wood/WoodFloor069_Color.png', {
        repeatX: 6,
        repeatY: 5,
        color: true,
      }),
      normalMap: this.loadTexture('/assets/textures/floor-wood/WoodFloor069_NormalGL.png', {
        repeatX: 6,
        repeatY: 5,
      }),
      roughnessMap: this.loadTexture('/assets/textures/floor-wood/WoodFloor069_Roughness.png', {
        repeatX: 6,
        repeatY: 5,
      }),
      roughness: 0.86,
      metalness: 0.02,
    })
  }

  createWallMaterial(repeatX = 1) {
    const map = this.loadTexture('/assets/textures/wall-planks/Planks021_Color.png', {
      color: true,
    }).clone()
    const normalMap = this.loadTexture('/assets/textures/wall-planks/Planks021_NormalGL.png').clone()
    const roughnessMap = this.loadTexture('/assets/textures/wall-planks/Planks021_Roughness.png').clone()

    for (const texture of [map, normalMap, roughnessMap]) {
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(repeatX, 1)
      texture.needsUpdate = true
    }

    return new THREE.MeshStandardMaterial({
      map,
      normalMap,
      roughnessMap,
      color: 0x8f9f5a,
      roughness: 0.82,
      metalness: 0.02,
    })
  }

  loadModel(path) {
    if (!this.modelPromises.has(path)) {
      this.modelPromises.set(
        path,
        this.gltfLoader.loadAsync(path).then((gltf) => gltf.scene)
      )
    }

    return this.modelPromises.get(path)
  }

  loadFbx(path) {
    if (!this.modelPromises.has(path)) {
      this.modelPromises.set(path, this.fbxLoader.loadAsync(path))
    }

    return this.modelPromises.get(path)
  }

  loadGltf(path) {
    if (!this.modelPromises.has(path)) {
      this.modelPromises.set(
        path,
        this.gltfLoader.loadAsync(path).then((gltf) => ({
          scene: gltf.scene,
          animations: gltf.animations ?? [],
        }))
      )
    }

    return this.modelPromises.get(path)
  }

  async createSoundObjectModel(label, targetSize) {
    if (label === 'aquarium') {
      return this.createAquariumModel(targetSize)
    }

    if (label === 'parrot') {
      return this.createParrotModel(targetSize)
    }

    const path = MODEL_BY_SOUND_LABEL[label]
    if (!path) return null

    const source = path.toLowerCase().endsWith('.fbx')
      ? await this.loadFbx(path)
      : await this.loadModel(path)
    const model = source.clone(true)
    applyShadows(model)
    this.fitModelToSize(model, targetSize, label === 'parrot' ? { floorOffset: 0 } : {})
    return model
  }

  createParrotModel(targetSize) {
    const group = new THREE.Group()
    const width = targetSize.x
    const height = targetSize.y
    const depth = targetSize.z

    const cageMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6a32,
      roughness: 0.42,
      metalness: 0.45,
    })
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2faa53,
      roughness: 0.58,
      emissive: 0x06240f,
    })
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d6dca,
      roughness: 0.55,
    })
    const beakMaterial = new THREE.MeshStandardMaterial({
      color: 0xffc857,
      roughness: 0.5,
    })

    const cageWidth = width * 0.82
    const cageDepth = depth * 0.82
    const cageHeight = height * 0.95
    const barRadius = 0.018

    for (const x of [-cageWidth / 2, 0, cageWidth / 2]) {
      for (const z of [-cageDepth / 2, cageDepth / 2]) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, cageHeight, 8), cageMaterial)
        bar.position.set(x, cageHeight / 2, z)
        group.add(bar)
      }
    }

    for (const z of [-cageDepth / 2, 0, cageDepth / 2]) {
      for (const x of [-cageWidth / 2, cageWidth / 2]) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, cageHeight, 8), cageMaterial)
        bar.position.set(x, cageHeight / 2, z)
        group.add(bar)
      }
    }

    const top = new THREE.Mesh(new THREE.TorusGeometry(cageWidth * 0.45, 0.025, 8, 32), cageMaterial)
    top.position.y = cageHeight
    top.rotation.x = Math.PI / 2
    group.add(top)

    const perch = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, cageWidth * 0.78, 10), cageMaterial)
    perch.position.y = cageHeight * 0.36
    perch.rotation.z = Math.PI / 2
    group.add(perch)

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), bodyMaterial)
    body.scale.set(0.8, 1.15, 0.72)
    body.position.set(0, cageHeight * 0.52, 0)
    group.add(body)

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), bodyMaterial)
    head.position.set(0, cageHeight * 0.72, 0.06)
    group.add(head)

    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), wingMaterial)
    wing.scale.set(0.45, 1, 0.28)
    wing.position.set(-0.11, cageHeight * 0.52, 0.02)
    group.add(wing)

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.11, 12), beakMaterial)
    beak.position.set(0, cageHeight * 0.72, 0.18)
    beak.rotation.x = Math.PI / 2
    group.add(beak)

    applyShadows(group)
    return group
  }

  createAquariumModel(targetSize) {
    const group = new THREE.Group()
    const width = targetSize.x
    const height = targetSize.y
    const depth = targetSize.z

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x9fe7ff,
      roughness: 0.12,
      metalness: 0.02,
      transparent: true,
      opacity: 0.35,
    })
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b8faf,
      roughness: 0.25,
      transparent: true,
      opacity: 0.62,
      emissive: 0x053746,
    })
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d252b,
      roughness: 0.55,
      metalness: 0.2,
    })
    const sandMaterial = new THREE.MeshStandardMaterial({
      color: 0xd3b36a,
      roughness: 0.9,
    })

    const tank = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), glassMaterial)
    tank.position.y = height / 2
    group.add(tank)

    const water = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, height * 0.55, depth * 0.88), waterMaterial)
    water.position.y = height * 0.46
    group.add(water)

    const sand = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, height * 0.08, depth * 0.84), sandMaterial)
    sand.position.y = height * 0.08
    group.add(sand)

    const railY = height + 0.035
    for (const z of [-depth / 2, depth / 2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.07, 0.06), frameMaterial)
      rail.position.set(0, railY, z)
      group.add(rail)
    }
    for (const x of [-width / 2, width / 2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, depth), frameMaterial)
      rail.position.set(x, railY, 0)
      group.add(rail)
    }

    applyShadows(group)
    return group
  }

  async createModel(path, targetSize, options = {}) {
    const gltf = await this.loadGltf(path)
    const model = cloneSkeleton(gltf.scene)
    applyShadows(model)

    if (targetSize) {
      this.fitModelToSize(model, targetSize, options)
    }

    return model
  }

  async createAnimatedModel(path, targetSize, options = {}) {
    const gltf = await this.loadGltf(path)
    const model = cloneSkeleton(gltf.scene)
    applyShadows(model)

    if (targetSize) {
      this.fitModelToSize(model, targetSize, options)
    }

    return {
      model,
      animations: gltf.animations,
    }
  }

  fitModelToSize(model, targetSize, options = {}) {
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())

    if (options.uniform === false) {
      const scale = new THREE.Vector3(
        size.x > 0 ? targetSize.x / size.x : 1,
        size.y > 0 ? targetSize.y / size.y : 1,
        size.z > 0 ? targetSize.z / size.z : 1
      )
      model.scale.multiply(scale)
    } else {
      const maxModelSize = Math.max(size.x, size.y, size.z)
      const maxTargetSize = Math.max(targetSize.x, targetSize.y, targetSize.z)

      if (maxModelSize <= 0) return

      const scale = maxTargetSize / maxModelSize
      model.scale.multiplyScalar(scale)
    }

    const fittedBox = new THREE.Box3().setFromObject(model)
    const center = fittedBox.getCenter(new THREE.Vector3())
    model.position.x -= center.x
    model.position.z -= center.z
    model.position.y -= fittedBox.min.y
    model.position.y += options.floorOffset ?? 0
  }
}
