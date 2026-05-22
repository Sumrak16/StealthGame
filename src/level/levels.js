export const LEVELS = [
  {
    id: 'house-heist',
    name: 'Дом с обходным коридором',
    previewCameraTarget: { x: 0, z: 1 },
    previewCameraBounds: {
      minX: -12,
      maxX: 12,
      minZ: -9,
      maxZ: 9,
    },
    floor: { width: 28, depth: 20 },
    playerStart: { x: -9.4, z: 7.05 },
    enemies: [
      {
        x: -8.9,
        z: 6.1,
        patrolPoints: [
          { x: -9.0, z: 6.1 },
          { x: -4.8, z: 6.1 },
          { x: -4.8, z: 2.35 },
          { x: -9.0, z: 2.35 },
        ],
      },
    ],
    objective: {
      type: 'document',
      x: 10.3,
      z: 1.25,
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
    },
    exit: {
      x: -9.4,
      z: 7.05,
      width: 1.8,
      depth: 1.8,
    },
    walls: [
      { x: -1.5, y: 1, z: -8, width: 21, height: 2, depth: 1 },
      { x: -12, y: 1, z: 0, width: 1, height: 2, depth: 16 },
      { x: 12, y: 1, z: 0, width: 1, height: 2, depth: 16 },
      { x: -12.4, y: 1, z: 8, width: 1.2, height: 2, depth: 1 },
      { x: 1.2, y: 1, z: 8, width: 18.4, height: 2, depth: 1 },

      { x: -10.4, y: 1, z: 4.15, width: 1, height: 2, depth: 6.1 },
      { x: -3.4, y: 1, z: 2.15, width: 1, height: 2, depth: 2.05 },
      { x: -3.4, y: 1, z: 6.65, width: 1, height: 2, depth: 1.35 },
      { x: -8.35, y: 1, z: 1.05, width: 4.1, height: 2, depth: 1 },
      { x: -3.95, y: 1, z: 1.05, width: 1.1, height: 2, depth: 1 },
      { x: -6.0, y: 1, z: 7.25, width: 5.0, height: 2, depth: 1 },
      { x: -6.9, y: 1, z: 4.2, width: 1.8, height: 2, depth: 1.8 },

      { x: -5.4, y: 1, z: -1.25, width: 4.1, height: 2, depth: 1 },
      { x: -7.95, y: 1, z: -0.1, width: 1, height: 2, depth: 2.3 },
      { x: -2.9, y: 1, z: -0.1, width: 1, height: 2, depth: 2.3 },

      { x: 0.9, y: 1, z: 3.25, width: 5.8, height: 2, depth: 1 },
      { x: 1.0, y: 1, z: 7.25, width: 8.2, height: 2, depth: 1 },
      { x: 4.4, y: 1, z: 5.2, width: 1, height: 2, depth: 4.1 },

      { x: 1.3, y: 1, z: 1.1, width: 2.5, height: 2, depth: 1 },
      { x: 0.05, y: 1, z: 2.05, width: 1, height: 2, depth: 1.9 },
      { x: 2.55, y: 1, z: 2.05, width: 1, height: 2, depth: 1.9 },

      { x: 7.4, y: 1, z: 3.25, width: 5.0, height: 2, depth: 1 },
      { x: 7.4, y: 1, z: -0.85, width: 5.0, height: 2, depth: 1 },
      { x: 5.0, y: 1, z: 1.2, width: 1, height: 2, depth: 4.1 },
      { x: 10.2, y: 1, z: 3.1, width: 1, height: 2, depth: 1.6 },
      { x: 10.2, y: 1, z: -0.65, width: 1, height: 2, depth: 1.4 },
    ],
    doors: [
      { x: -3.4, z: 5.15, width: 1.65, depth: 0.28, rotation: Math.PI / 2 },
      { x: 1.3, z: 3.25, width: 1.55, depth: 0.28 },
      { x: 4.4, z: 5.25, width: 1.65, depth: 0.28, rotation: Math.PI / 2 },
    ],
    desks: [
      { x: -5.4, z: -0.35, width: 2.3 },
      { x: 10.25, z: 1.25, width: 2.1 },
    ],
    columns: [
      { x: -1.25, z: 5.3 },
    ],
    soundObjects: [
      { x: -10.85, z: 7.05, width: 0.9, depth: 0.8, color: 0x35404a, label: 'front-door', emissive: 0x12313d },
      { x: -5.4, z: 6.55, width: 0.9, depth: 0.8, color: 0x3a3326, label: 'clock', emissive: 0x34240c },
      { x: -5.4, z: -0.25, width: 1.8, depth: 0.9, color: 0x244a55, label: 'aquarium', emissive: 0x0a5366 },
      { x: 1.3, z: 1.75, width: 1.0, depth: 1.0, color: 0x394526, label: 'parrot', emissive: 0x2f4d12 },
      { x: 5.95, z: 5.35, width: 0.9, depth: 0.7, color: 0x263a45, label: 'camera', emissive: 0x0d5361 },
      { x: 6.55, z: 1.1, width: 1.8, depth: 1.0, color: 0x4b392a, label: 'creaky-floor', emissive: 0x36200c },
    ],
    alarmZones: [
      { x: 8.65, z: 2.0, width: 1.6, depth: 1.35 },
    ],
    markers: [
      { x: -9.4, z: 7.05, width: 1.9, depth: 1.9, color: 0x1d3b34, emissive: 0x0d4f35 },
      { x: 10.3, z: 1.25, width: 1.35, depth: 1.35, color: 0x24394a, emissive: 0x004d66 },
      { x: -3.4, z: 5.15, width: 0.12, depth: 1.65, color: 0x78d7ff, emissive: 0x1d5366 },
      { x: 1.3, z: 3.25, width: 1.55, depth: 0.12, color: 0x78d7ff, emissive: 0x1d5366 },
      { x: 4.4, z: 5.25, width: 0.12, depth: 1.65, color: 0x78d7ff, emissive: 0x1d5366 },
    ],
    navigationPoints: [
      { x: -9.4, z: 7.05 },
      { x: -9.0, z: 6.1 },
      { x: -4.8, z: 6.1 },
      { x: -4.8, z: 2.35 },
      { x: -9.0, z: 2.35 },
      { x: -5.4, z: -0.25 },
      { x: -3.4, z: 5.15 },
      { x: 1.3, z: 5.25 },
      { x: 1.3, z: 1.75 },
      { x: 5.95, z: 5.35 },
      { x: 6.55, z: 1.1 },
      { x: 8.65, z: 2.0 },
      { x: 10.3, z: 1.25 },
    ],
  },
]

export const FIRST_LEVEL_ID = LEVELS[0].id

export function getLevelById(id = FIRST_LEVEL_ID) {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0]
}
