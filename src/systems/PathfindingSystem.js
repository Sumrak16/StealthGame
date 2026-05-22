import * as THREE from 'three'

export class PathfindingSystem {
  constructor(walls, options = {}) {
    this.walls = walls
    this.cellSize = options.cellSize ?? 1
    this.minX = options.minX ?? -9
    this.maxX = options.maxX ?? 9
    this.minZ = options.minZ ?? -9
    this.maxZ = options.maxZ ?? 9
    this.agentSize = new THREE.Vector3(0.9, 1, 0.9)

    this.grid = new Map()
    this.buildGrid()
  }

  buildGrid() {
    this.grid.clear()

    for (let gx = this.minX; gx <= this.maxX; gx += this.cellSize) {
      for (let gz = this.minZ; gz <= this.maxZ; gz += this.cellSize) {
        const key = this.getKey(gx, gz)
        const position = new THREE.Vector3(gx, 0.5, gz)
        const blocked = !this.canStandAt(position)

        this.grid.set(key, {
          x: gx,
          z: gz,
          blocked,
        })
      }
    }
  }

  canStandAt(position) {
    const agentBox = new THREE.Box3().setFromCenterAndSize(
      position.clone(),
      this.agentSize
    )

    for (const wall of this.walls) {
      const wallBox = new THREE.Box3().setFromObject(wall)
      if (agentBox.intersectsBox(wallBox)) {
        return false
      }
    }

    return true
  }

  getKey(x, z) {
    return `${x},${z}`
  }

  worldToGrid(position) {
    const x = Math.round(position.x / this.cellSize) * this.cellSize
    const z = Math.round(position.z / this.cellSize) * this.cellSize
    return { x, z }
  }

  gridToWorld(node) {
    return new THREE.Vector3(node.x, 0.5, node.z)
  }

  getNeighbors(node) {
    const dirs = [
      { x: this.cellSize, z: 0 },
      { x: -this.cellSize, z: 0 },
      { x: 0, z: this.cellSize },
      { x: 0, z: -this.cellSize },
    ]

    const neighbors = []

    for (const dir of dirs) {
      const nx = node.x + dir.x
      const nz = node.z + dir.z
      const key = this.getKey(nx, nz)

      if (this.grid.has(key)) {
        const cell = this.grid.get(key)
        if (!cell.blocked) {
          neighbors.push(cell)
        }
      }
    }

    return neighbors
  }

  heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.z - b.z)
  }

  findNearestFreeCell(target) {
    const start = this.worldToGrid(target)
    const startKey = this.getKey(start.x, start.z)

    if (this.grid.has(startKey) && !this.grid.get(startKey).blocked) {
      return this.grid.get(startKey)
    }

    let bestCell = null
    let bestDistance = Infinity

    for (const cell of this.grid.values()) {
      if (cell.blocked) continue

      const dx = cell.x - target.x
      const dz = cell.z - target.z
      const dist = dx * dx + dz * dz

      if (dist < bestDistance) {
        bestDistance = dist
        bestCell = cell
      }
    }

    return bestCell
  }

  reconstructPath(cameFrom, currentKey) {
    const path = []

    while (cameFrom.has(currentKey)) {
      const node = this.grid.get(currentKey)
      path.push(this.gridToWorld(node))
      currentKey = cameFrom.get(currentKey)
    }

    path.reverse()
    return path
  }

  findPath(startWorld, endWorld) {
    const startGrid = this.findNearestFreeCell(startWorld)
    const endGrid = this.findNearestFreeCell(endWorld)

    if (!startGrid || !endGrid) return []

    const startKey = this.getKey(startGrid.x, startGrid.z)
    const endKey = this.getKey(endGrid.x, endGrid.z)

    const openSet = new Set([startKey])
    const cameFrom = new Map()

    const gScore = new Map()
    const fScore = new Map()

    gScore.set(startKey, 0)
    fScore.set(startKey, this.heuristic(startGrid, endGrid))

    while (openSet.size > 0) {
      let currentKey = null
      let bestScore = Infinity

      for (const key of openSet) {
        const score = fScore.get(key) ?? Infinity
        if (score < bestScore) {
          bestScore = score
          currentKey = key
        }
      }

      if (currentKey === endKey) {
        return this.reconstructPath(cameFrom, currentKey)
      }

      openSet.delete(currentKey)
      const currentNode = this.grid.get(currentKey)

      for (const neighbor of this.getNeighbors(currentNode)) {
        const neighborKey = this.getKey(neighbor.x, neighbor.z)
        const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1

        if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
          cameFrom.set(neighborKey, currentKey)
          gScore.set(neighborKey, tentativeG)
          fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, endGrid))
          openSet.add(neighborKey)
        }
      }
    }

    return []
  }
}