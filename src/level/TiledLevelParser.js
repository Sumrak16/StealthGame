const DEFAULT_LEVEL_TEXT = {
  title: 'Найдите тайник в доме',
  pendingStatus: 'Пройдите через обходной коридор, комнаты и зону сигнализации.',
  completedTitle: 'Вернитесь ко входу',
  completedStatus: 'Тайник найден. Возвращайтесь к выходу и избегайте охраны.',
  previewTitle: 'Запомните план дома',
  previewStatus: 'Осмотрите двери, круговой коридор, аквариум, попугая, камеру, скрип пола и тревожную плиту.',
  victoryTitle: 'Побег выполнен',
  victoryStatus: 'Статус: дом покинут без тревоги',
  failureTitle: 'Задание провалено',
  failureStatus: 'Статус: тревога или охрана остановили попытку',
}

const SOUND_STYLE = {
  aquarium: { width: 1.8, depth: 0.9, color: 0x244a55, emissive: 0x0a5366 },
  clock: { width: 0.9, depth: 0.8, color: 0x3a3326, emissive: 0x34240c },
  twinkle: { width: 1.0, depth: 1.0, color: 0xd7d1c0, emissive: 0x4a4534 },
  parrot: { width: 1.0, depth: 1.0, color: 0x394526, emissive: 0x2f4d12 },
  camera: { width: 0.9, depth: 0.7, color: 0x263a45, emissive: 0x0d5361 },
  'creaky-floor': { width: 1.8, depth: 1.0, color: 0x4b392a, emissive: 0x36200c },
  'front-door': { width: 0.9, depth: 0.8, color: 0x35404a, emissive: 0x12313d },
}

function getObjectKind(object) {
  return object.type || object.class || object.name || ''
}

function getProperties(object) {
  const result = {}

  for (const property of object.properties ?? []) {
    result[property.name] = property.value
  }

  return result
}

function createCoordinateConverter(map) {
  const tileWidth = map.tilewidth || 100
  const tileHeight = map.tileheight || 100
  const mapWidth = map.width || 28
  const mapHeight = map.height || 20

  return {
    sizeX(value = 0) {
      return value / tileWidth
    },
    sizeZ(value = 0) {
      return value / tileHeight
    },
    point(object) {
      const centerX = object.x + (object.width || 0) / 2
      const centerY = object.y + (object.height || 0) / 2

      return {
        x: centerX / tileWidth - mapWidth / 2,
        z: centerY / tileHeight - mapHeight / 2,
      }
    },
  }
}

function parsePatrol(value, fallback) {
  if (!value || typeof value !== 'string') return fallback

  const points = value
    .split(';')
    .map((entry) => {
      const [x, z] = entry.split(',').map((part) => Number(part.trim()))
      return Number.isFinite(x) && Number.isFinite(z) ? { x, z } : null
    })
    .filter(Boolean)

  return points.length > 0 ? points : fallback
}

function createGuardPatrol(center) {
  return [
    { x: center.x - 2.1, z: center.z - 1.7 },
    { x: center.x + 2.1, z: center.z - 1.7 },
    { x: center.x + 2.1, z: center.z + 1.7 },
    { x: center.x - 2.1, z: center.z + 1.7 },
  ]
}

function addNavigationPoint(level, point) {
  level.navigationPoints.push({ x: point.x, z: point.z })
}

export function parseTiledLevel(map) {
  const convert = createCoordinateConverter(map)
  const level = {
    id: 'tiled-house-1',
    name: 'Дом из Tiled',
    previewCameraTarget: { x: 0, z: 0 },
    previewCameraBounds: {
      minX: -map.width / 2,
      maxX: map.width / 2,
      minZ: -map.height / 2,
      maxZ: map.height / 2,
    },
    floor: { width: map.width, depth: map.height },
    playerStart: { x: -9, z: 7 },
    enemies: [],
    objective: {
      type: 'document',
      x: 8,
      z: 6,
      ...DEFAULT_LEVEL_TEXT,
    },
    exit: {
      x: -9,
      z: 7,
      width: 1.8,
      depth: 1.8,
    },
    walls: [],
    doors: [],
    desks: [],
    columns: [],
    soundObjects: [],
    alarmZones: [],
    markers: [],
    navigationPoints: [],
  }

  for (const layer of map.layers ?? []) {
    if (layer.type !== 'objectgroup') continue

    for (const object of layer.objects ?? []) {
      const kind = getObjectKind(object)
      const properties = getProperties(object)
      const point = convert.point(object)

      if (kind === 'wall' && object.width > 0 && object.height > 0) {
        level.walls.push({
          x: point.x,
          y: 1,
          z: point.z,
          width: convert.sizeX(object.width),
          height: 2,
          depth: convert.sizeZ(object.height),
        })
        continue
      }

      if (kind === 'door' && object.width > 0 && object.height > 0) {
        const isVertical = object.height > object.width
        level.doors.push({
          x: point.x,
          z: point.z,
          width: isVertical ? convert.sizeZ(object.height) : convert.sizeX(object.width),
          depth: Math.max(isVertical ? convert.sizeX(object.width) : convert.sizeZ(object.height), 0.28),
          rotation: isVertical ? Math.PI / 2 : 0,
        })
        addNavigationPoint(level, point)
        continue
      }

      if (kind === 'sound') {
        const label = properties.label || object.name || 'clock'
        const style = SOUND_STYLE[label] ?? SOUND_STYLE.clock
        level.soundObjects.push({
          x: point.x,
          z: point.z,
          ...style,
          label,
        })
        addNavigationPoint(level, point)
        continue
      }

      if (kind === 'alarm' && object.width > 0 && object.height > 0) {
        level.alarmZones.push({
          x: point.x,
          z: point.z,
          width: convert.sizeX(object.width),
          depth: convert.sizeZ(object.height),
        })
        continue
      }

      if (kind === 'playerStart') {
        level.playerStart = point
        level.exit.x = point.x
        level.exit.z = point.z
        level.markers.push({
          x: point.x,
          z: point.z,
          width: 1.9,
          depth: 1.9,
          color: 0x1d3b34,
          emissive: 0x0d4f35,
        })
        addNavigationPoint(level, point)
        continue
      }

      if (kind === 'exit') {
        level.exit = {
          x: point.x,
          z: point.z,
          width: 1.8,
          depth: 1.8,
        }
        continue
      }

      if (kind === 'objective') {
        level.objective.x = point.x
        level.objective.z = point.z
        level.markers.push({
          x: point.x,
          z: point.z,
          width: 1.35,
          depth: 1.35,
          color: 0x24394a,
          emissive: 0x004d66,
        })
        addNavigationPoint(level, point)
        continue
      }

      if (kind === 'guard') {
        const fallbackPatrol = createGuardPatrol(point)
        const patrolPoints = properties.patrolMode === 'absolute'
          ? parsePatrol(properties.patrol, fallbackPatrol)
          : fallbackPatrol
        level.enemies.push({
          x: point.x,
          z: point.z,
          patrolPoints,
        })
        for (const patrolPoint of patrolPoints) addNavigationPoint(level, patrolPoint)
      }
    }
  }

  if (level.enemies.length === 0) {
    level.enemies.push({ x: 0, z: 0, patrolPoints: [] })
  }

  level.previewCameraTarget = { ...level.playerStart }
  return level
}

export async function loadTiledLevel(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Unable to load Tiled level: ${response.status}`)
  }

  const map = await response.json()
  return parseTiledLevel(map)
}
