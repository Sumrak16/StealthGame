import * as THREE from 'three'

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1b1d29)
    this.scene.fog = new THREE.Fog(0x1b1d29, 18, 40)

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    document.body.appendChild(this.renderer.domElement)

    this.playerLight = null
    this.setupLights()
    this.setupResize()
  }

  setupLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.1)
    this.directionalLight.position.set(8, 14, 6)
    this.directionalLight.castShadow = true

    this.directionalLight.shadow.mapSize.width = 2048
    this.directionalLight.shadow.mapSize.height = 2048
    this.directionalLight.shadow.camera.near = 0.5
    this.directionalLight.shadow.camera.far = 50
    this.directionalLight.shadow.camera.left = -20
    this.directionalLight.shadow.camera.right = 20
    this.directionalLight.shadow.camera.top = 20
    this.directionalLight.shadow.camera.bottom = -20

    this.scene.add(this.directionalLight)

    this.fillLight = new THREE.PointLight(0x88aaff, 0.5, 30)
    this.fillLight.position.set(-6, 6, -6)
    this.scene.add(this.fillLight)
  }

  setPreviewLighting() {
    this.scene.background = new THREE.Color(0x1b1d29)
    this.scene.fog = new THREE.Fog(0x1b1d29, 20, 46)
    this.ambientLight.intensity = 0.42
    this.directionalLight.intensity = 1.15
    this.fillLight.intensity = 0.55

    if (this.playerLight) {
      this.playerLight.intensity = 0
    }
  }

  setDarkLighting() {
    this.scene.background = new THREE.Color(0x030407)
    this.scene.fog = new THREE.Fog(0x030407, 5, 15)
    this.ambientLight.intensity = 0.015
    this.directionalLight.intensity = 0.05
    this.fillLight.intensity = 0.03

    if (this.playerLight) {
      this.playerLight.intensity = 2.8
      this.playerLight.distance = 6.5
    }
  }

  attachPlayerLight(target) {
    this.detachPlayerLight()

    this.playerLight = new THREE.PointLight(0x9fd7ff, 2.8, 6.5, 1.9)
    this.playerLight.position.set(0, 2.6, 0)
    target.add(this.playerLight)
  }

  detachPlayerLight() {
    if (!this.playerLight) return

    this.playerLight.removeFromParent()
    this.playerLight = null
  }

  setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }
}
