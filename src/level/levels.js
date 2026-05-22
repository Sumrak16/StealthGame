export const LEVELS = [
  {
    id: 'training-bank',
    name: 'Учебное отделение',
    previewCameraTarget: { x: 0, z: 0 },
    previewCameraBounds: {
      minX: -9.5,
      maxX: 9.5,
      minZ: -9.5,
      maxZ: 9.5,
    },
    floor: { width: 30, depth: 26 },
    playerStart: { x: -9.2, z: 8.4 },
    enemies: [
      {
        x: 4.5,
        z: 2.5,
        patrolPoints: [
          { x: 5.8, z: 3 },
          { x: 5.8, z: 0 },
          { x: 5.8, z: -2.6 },
          { x: 9.8, z: -2.6 },
          { x: 9.8, z: 2.8 },
        ],
      },
    ],
    objective: {
      type: 'document',
      x: 7.6,
      z: -7.6,
      title: 'Найдите секретный документ',
    },
    exit: {
      x: -9,
      z: 8.4,
      width: 1.5,
      depth: 1.5,
    },
    walls: [
      { x: 0, y: 1, z: -10, width: 24, height: 2, depth: 1 },
      { x: 0, y: 1, z: 10, width: 24, height: 2, depth: 1 },
      { x: -12, y: 1, z: 0, width: 1, height: 2, depth: 20 },
      { x: 12, y: 1, z: 0, width: 1, height: 2, depth: 20 },
      { x: -6, y: 1, z: 4.8, width: 12, height: 2, depth: 1 },
      { x: 7.6, y: 1, z: 4.8, width: 4.8, height: 2, depth: 1 },
      { x: -6, y: 1, z: 0.2, width: 1, height: 2, depth: 8.2 },
      { x: -1.8, y: 1, z: 0.2, width: 1, height: 2, depth: 8.2 },
      { x: 2.8, y: 1, z: 0.6, width: 1, height: 2, depth: 7.6 },
      { x: 8.8, y: 1, z: 0.6, width: 1, height: 2, depth: 7.6 },
      { x: 3.4, y: 1, z: -3.8, width: 2.2, height: 2, depth: 1 },
      { x: 8, y: 1, z: -3.8, width: 2.4, height: 2, depth: 1 },
      { x: 2.4, y: 1, z: -7.4, width: 1, height: 2, depth: 4.2 },
      { x: 9.2, y: 1, z: -7.4, width: 1, height: 2, depth: 4.2 },
      { x: 5.8, y: 1, z: -9, width: 6.8, height: 2, depth: 1 },
    ],
    desks: [
      { x: -9.3, z: 7.2, width: 3.2 },
      { x: -5.4, z: 7.2, width: 3.2 },
      { x: -1.5, z: 7.2, width: 3.2 },
      { x: 5.7, z: 7.2, width: 3.6 },
    ],
    columns: [
      { x: -9.6, z: 2.2 },
      { x: -9.6, z: -5.8 },
      { x: 0.3, z: -2.4 },
      { x: 10.1, z: 2.3 },
    ],
    soundObjects: [
      { x: -9.4, z: -6.8, width: 1.2, depth: 1.2, color: 0x334b5f, label: 'atm', emissive: 0x0a4158 },
      { x: -3.8, z: 6.2, width: 1.2, depth: 0.8, color: 0x26323d, label: 'teller-terminal', emissive: 0x0d5361 },
      { x: 0.6, z: -2.4, width: 1.1, depth: 1.1, color: 0x45505c, label: 'server-rack', emissive: 0x0d425c },
      { x: 10, z: 2.1, width: 1.1, depth: 1.1, color: 0x263a45, label: 'camera-console', emissive: 0x0d5361 },
      { x: 5.8, z: -7.5, width: 1.8, depth: 1.2, color: 0x303842, label: 'vault-safe', emissive: 0x17324d },
    ],
    markers: [
      { x: -9, z: 8.4, width: 1.9, depth: 1.9, color: 0x1d3b34, emissive: 0x0d4f35 },
      { x: 7.6, z: -7.6, width: 1.4, depth: 1.4, color: 0x24394a, emissive: 0x004d66 },
      { x: -3.9, z: 4.8, width: 2.1, depth: 0.12, color: 0x78d7ff, emissive: 0x1d5366 },
      { x: 5.8, z: -3.8, width: 2.1, depth: 0.12, color: 0x78d7ff, emissive: 0x1d5366 },
    ],
    navigationPoints: [
      { x: -9, z: 8.4 },
      { x: -9, z: 3 },
      { x: -9, z: -6.8 },
      { x: -3.9, z: 3 },
      { x: -3.9, z: -6.8 },
      { x: 0.6, z: 3 },
      { x: 0.6, z: -2.4 },
      { x: 5.8, z: 3 },
      { x: 5.8, z: -2.6 },
      { x: 5.8, z: -7.5 },
      { x: 9.8, z: 2.8 },
      { x: 9.8, z: -2.6 },
      { x: 7.6, z: -7.6 },
    ],
  },
]

export const FIRST_LEVEL_ID = LEVELS[0].id

export function getLevelById(id = FIRST_LEVEL_ID) {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0]
}
