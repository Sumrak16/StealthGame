import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { applyShadows } from './VisualFactory'

const MODEL_BY_SOUND_LABEL = {
  clock: '/assets/models/scifi/props/Prop_Computer.gltf',
  aquarium: '/assets/models/scifi/props/Prop_Chest.gltf',
  parrot: '/assets/models/scifi/props/Prop_Chest.gltf',
  camera: '/assets/models/scifi/props/Prop_AccessPoint.gltf',
  'creaky-floor': '/assets/models/scifi/props/Prop_Vent_Big.gltf',
  'front-door': '/assets/models/scifi/platforms/Door_Simple.gltf',
}

export class AssetManager {
  constructor(renderer) {
    this.renderer = renderer
    this.textureLoader = new THREE.TextureLoader()
    this.gltfLoader = new GLTFLoader()
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

  async createSoundObjectModel(label, targetSize) {
    const path = MODEL_BY_SOUND_LABEL[label]
    if (!path) return null

    const source = await this.loadModel(path)
    const model = source.clone(true)
    applyShadows(model)
    this.fitModelToSize(model, targetSize)
    return model
  }

  async createModel(path, targetSize) {
    const source = await this.loadModel(path)
    const model = source.clone(true)
    applyShadows(model)

    if (targetSize) {
      this.fitModelToSize(model, targetSize)
    }

    return model
  }

  fitModelToSize(model, targetSize) {
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const maxModelSize = Math.max(size.x, size.y, size.z)
    const maxTargetSize = Math.max(targetSize.x, targetSize.y, targetSize.z)

    if (maxModelSize > 0) {
      const scale = maxTargetSize / maxModelSize
      model.scale.multiplyScalar(scale)
    }

    const fittedBox = new THREE.Box3().setFromObject(model)
    const center = fittedBox.getCenter(new THREE.Vector3())
    model.position.sub(center)
    model.position.y -= fittedBox.min.y
  }
}
