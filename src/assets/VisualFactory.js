import * as THREE from 'three'

export function applyShadows(root) {
  root.traverse((object) => {
    if (!object.isMesh) return
    object.castShadow = true
    object.receiveShadow = true
  })
}

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.65,
    metalness: options.metalness ?? 0.08,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 1,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  })
}

function addBox(group, size, position, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat)
  mesh.position.set(position.x, position.y, position.z)
  group.add(mesh)
  return mesh
}

function addCylinder(group, radiusTop, radiusBottom, height, position, mat, segments = 16) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    mat
  )
  mesh.position.set(position.x, position.y, position.z)
  group.add(mesh)
  return mesh
}

export function createPlayerVisual() {
  const group = new THREE.Group()

  const suit = material(0x1f7a4d, { roughness: 0.72 })
  const suitDark = material(0x145334, { roughness: 0.78 })
  const visor = material(0x89f7ff, {
    roughness: 0.28,
    metalness: 0.2,
    emissive: 0x0b4f57,
  })
  const boots = material(0x15191d, { roughness: 0.85 })

  addCylinder(group, 0.28, 0.34, 0.66, { x: 0, y: 0.0, z: 0 }, suit)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 12), suitDark)
  head.position.set(0, 0.48, 0)
  group.add(head)

  addBox(group, { x: 0.38, y: 0.12, z: 0.08 }, { x: 0, y: 0.5, z: 0.24 }, visor)
  addBox(group, { x: 0.18, y: 0.46, z: 0.18 }, { x: -0.32, y: -0.03, z: 0.02 }, suitDark)
  addBox(group, { x: 0.18, y: 0.46, z: 0.18 }, { x: 0.32, y: -0.03, z: 0.02 }, suitDark)
  addBox(group, { x: 0.2, y: 0.12, z: 0.34 }, { x: -0.16, y: -0.4, z: 0.02 }, boots)
  addBox(group, { x: 0.2, y: 0.12, z: 0.34 }, { x: 0.16, y: -0.4, z: 0.02 }, boots)
  addBox(group, { x: 0.46, y: 0.4, z: 0.16 }, { x: 0, y: -0.04, z: -0.31 }, suitDark)

  applyShadows(group)
  return group
}

export function createEnemyVisual() {
  const group = new THREE.Group()

  const armor = material(0xff3333, { roughness: 0.6, metalness: 0.14 })
  const armorDark = material(0x501616, { roughness: 0.76, metalness: 0.08 })
  const visor = material(0xffd85a, {
    roughness: 0.3,
    emissive: 0x4a3000,
  })

  addCylinder(group, 0.34, 0.38, 0.72, { x: 0, y: -0.02, z: 0 }, armor, 6)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), armor)
  head.position.set(0, 0.5, 0)
  group.add(head)

  addBox(group, { x: 0.44, y: 0.1, z: 0.08 }, { x: 0, y: 0.53, z: 0.25 }, visor)
  addBox(group, { x: 0.18, y: 0.52, z: 0.2 }, { x: -0.38, y: -0.06, z: 0.02 }, armorDark)
  addBox(group, { x: 0.18, y: 0.52, z: 0.2 }, { x: 0.38, y: -0.06, z: 0.02 }, armorDark)
  addBox(group, { x: 0.26, y: 0.12, z: 0.38 }, { x: -0.16, y: -0.43, z: 0.02 }, armorDark)
  addBox(group, { x: 0.26, y: 0.12, z: 0.38 }, { x: 0.16, y: -0.43, z: 0.02 }, armorDark)

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.72, 2.4, 32, 1, true),
    material(0xffd85a, {
      emissive: 0x3a2500,
      transparent: true,
      opacity: 0.16,
      roughness: 1,
    })
  )
  cone.position.set(0, -0.44, 1.22)
  cone.rotation.x = Math.PI / 2
  group.add(cone)

  group.userData.tintMaterials = [armor]
  applyShadows(group)
  cone.castShadow = false
  cone.receiveShadow = false
  return group
}

export function tintVisual(root, color) {
  const tintMaterials = root.userData.tintMaterials ?? []
  for (const mat of tintMaterials) {
    mat.color.setHex(color)
  }
}

export function createObjectiveVisual() {
  const group = new THREE.Group()

  const paper = material(0xe8f4ff, {
    roughness: 0.42,
    metalness: 0.02,
    emissive: 0x102a36,
  })
  const line = material(0x21475a, { roughness: 0.5 })
  const glow = material(0x00ccff, {
    roughness: 0.35,
    emissive: 0x007799,
    transparent: true,
    opacity: 0.45,
  })

  addBox(group, { x: 0.58, y: 0.04, z: 0.42 }, { x: 0, y: 0.28, z: 0 }, paper)
  addBox(group, { x: 0.38, y: 0.012, z: 0.035 }, { x: 0, y: 0.31, z: -0.08 }, line)
  addBox(group, { x: 0.3, y: 0.012, z: 0.035 }, { x: -0.04, y: 0.31, z: 0.02 }, line)
  addBox(group, { x: 0.22, y: 0.012, z: 0.035 }, { x: -0.08, y: 0.31, z: 0.12 }, line)

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.025, 8, 32), glow)
  ring.position.y = 0.08
  ring.rotation.x = Math.PI / 2
  group.add(ring)

  applyShadows(group)
  return group
}

export function createExitZoneVisual(width, depth) {
  const group = new THREE.Group()
  const base = material(0x1f3141, { roughness: 0.7, emissive: 0x071018 })
  const glow = material(0x66ffb2, {
    roughness: 0.4,
    emissive: 0x0c7f4d,
  })

  addBox(group, { x: width, y: 0.08, z: depth }, { x: 0, y: 0.04, z: 0 }, base)

  const borderDepth = 0.08
  addBox(group, { x: width, y: 0.04, z: borderDepth }, { x: 0, y: 0.11, z: -depth / 2 + borderDepth / 2 }, glow)
  addBox(group, { x: width, y: 0.04, z: borderDepth }, { x: 0, y: 0.11, z: depth / 2 - borderDepth / 2 }, glow)
  addBox(group, { x: borderDepth, y: 0.04, z: depth }, { x: -width / 2 + borderDepth / 2, y: 0.11, z: 0 }, glow)
  addBox(group, { x: borderDepth, y: 0.04, z: depth }, { x: width / 2 - borderDepth / 2, y: 0.11, z: 0 }, glow)

  applyShadows(group)
  return group
}

export function addWallDetails(wall, width, height, depth) {
  const trimMat = material(0x454b54, { roughness: 0.82, metalness: 0.1 })
  const lightMat = material(0x7ad7ff, {
    roughness: 0.4,
    emissive: 0x123d4a,
  })
  const capMat = material(0xa1a6ad, { roughness: 0.86, metalness: 0.04 })

  const inset = 0.08
  const trimInset = 0.06

  if (width >= depth) {
    const detailWidth = Math.max(0.1, width - inset)
    const trimZ = Math.max(0.04, depth * 0.12)

    addBox(wall, { x: detailWidth, y: 0.045, z: Math.max(0.08, depth - inset) }, { x: 0, y: height / 2 + 0.025, z: 0 }, capMat)
    addBox(wall, { x: detailWidth, y: 0.08, z: trimZ }, { x: 0, y: height / 2 + 0.07, z: -depth / 2 + trimInset }, trimMat)
    addBox(wall, { x: detailWidth, y: 0.08, z: trimZ }, { x: 0, y: height / 2 + 0.07, z: depth / 2 - trimInset }, trimMat)
    addBox(wall, { x: Math.max(0.55, Math.min(width - inset, width * 0.2)), y: 0.08, z: 0.045 }, { x: 0, y: 0.32, z: -depth / 2 + 0.03 }, lightMat)
  } else {
    const detailDepth = Math.max(0.1, depth - inset)
    const trimX = Math.max(0.04, width * 0.12)

    addBox(wall, { x: Math.max(0.08, width - inset), y: 0.045, z: detailDepth }, { x: 0, y: height / 2 + 0.025, z: 0 }, capMat)
    addBox(wall, { x: trimX, y: 0.08, z: detailDepth }, { x: -width / 2 + trimInset, y: height / 2 + 0.07, z: 0 }, trimMat)
    addBox(wall, { x: trimX, y: 0.08, z: detailDepth }, { x: width / 2 - trimInset, y: height / 2 + 0.07, z: 0 }, trimMat)
    addBox(wall, { x: 0.045, y: 0.08, z: Math.max(0.55, Math.min(depth - inset, depth * 0.2)) }, { x: -width / 2 + 0.03, y: 0.32, z: 0 }, lightMat)
  }

  applyShadows(wall)
}
